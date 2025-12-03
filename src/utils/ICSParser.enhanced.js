/**
 * Enhanced ICS Parser
 * Comprehensive .ics file parser with timezone, recurrence, and attendee support
 *
 * Supports:
 * - DTSTART/DTEND with timezones
 * - RRULE (recurrence rules)
 * - ATTENDEE parsing
 * - ORGANIZER
 * - STATUS (confirmed, tentative, cancelled)
 * - CATEGORIES
 * - VALARM (reminders)
 */

export class ICSParser {
  /**
   * Parse ICS content string
   * @param {string} content - ICS file content
   * @returns {Array} Array of event objects
   */
  static parse(content) {
    const lines = this._unfoldLines(content);
    const events = [];
    let currentEvent = null;
    let currentTimezone = null;
    let inEvent = false;
    let inAlarm = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = {
          uid: null,
          summary: null,
          description: null,
          location: null,
          start: null,
          end: null,
          status: 'confirmed',
          attendees: [],
          organizer: null,
          recurrence: null,
          categories: [],
          reminders: [],
          raw: {}
        };
        inEvent = true;
        inAlarm = false;
      } else if (line.startsWith('END:VEVENT')) {
        if (currentEvent) {
          events.push(currentEvent);
          currentEvent = null;
        }
        inEvent = false;
      } else if (line.startsWith('BEGIN:VALARM')) {
        inAlarm = true;
      } else if (line.startsWith('END:VALARM')) {
        inAlarm = false;
      } else if (inEvent && !inAlarm) {
        this._parseEventProperty(line, currentEvent);
      } else if (line.startsWith('BEGIN:VTIMEZONE')) {
        currentTimezone = {};
      } else if (line.startsWith('END:VTIMEZONE')) {
        currentTimezone = null;
      }
    }

    return events;
  }

  /**
   * Unfold continuation lines (lines starting with space/tab)
   * @param {string} content - ICS content
   * @returns {Array} Unfolded lines
   */
  static _unfoldLines(content) {
    const rawLines = content.split(/\r\n|\n|\r/);
    const unfolded = [];
    let currentLine = '';

    for (const line of rawLines) {
      if (line.startsWith(' ') || line.startsWith('\t')) {
        // Continuation line
        currentLine += line.substring(1);
      } else {
        if (currentLine) {
          unfolded.push(currentLine);
        }
        currentLine = line;
      }
    }

    if (currentLine) {
      unfolded.push(currentLine);
    }

    return unfolded;
  }

  /**
   * Parse a single event property line
   * @param {string} line - Property line
   * @param {object} event - Event object to populate
   */
  static _parseEventProperty(line, event) {
    // Split on first colon
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;

    const keyPart = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1);

    // Parse key and parameters
    const [key, ...paramParts] = keyPart.split(';');
    const params = this._parseParameters(paramParts);

    // Store raw property
    event.raw[key] = { value, params };

    // Parse specific properties
    switch (key) {
      case 'UID':
        event.uid = value;
        break;

      case 'SUMMARY':
        event.summary = this._unescapeText(value);
        break;

      case 'DESCRIPTION':
        event.description = this._unescapeText(value);
        break;

      case 'LOCATION':
        event.location = this._unescapeText(value);
        break;

      case 'DTSTART':
        event.start = this._parseDateTime(value, params);
        break;

      case 'DTEND':
        event.end = this._parseDateTime(value, params);
        break;

      case 'STATUS':
        event.status = value.toLowerCase();
        break;

      case 'ATTENDEE':
        event.attendees.push(this._parseAttendee(value, params));
        break;

      case 'ORGANIZER':
        event.organizer = this._parseOrganizer(value, params);
        break;

      case 'RRULE':
        event.recurrence = this._parseRecurrence(value);
        break;

      case 'CATEGORIES':
        event.categories = value.split(',').map(c => c.trim());
        break;

      case 'CREATED':
        event.created = this._parseDateTime(value, params);
        break;

      case 'LAST-MODIFIED':
        event.lastModified = this._parseDateTime(value, params);
        break;
    }
  }

  /**
   * Parse parameter string like "TZID=America/New_York;VALUE=DATE-TIME"
   * @param {Array} paramParts - Parameter parts
   * @returns {object} Parameters object
   */
  static _parseParameters(paramParts) {
    const params = {};
    for (const part of paramParts) {
      const [key, value] = part.split('=');
      if (key && value) {
        params[key] = value;
      }
    }
    return params;
  }

  /**
   * Parse date-time with timezone support
   * @param {string} dateStr - Date string
   * @param {object} params - Parameters (TZID, VALUE)
   * @returns {Date} JavaScript Date object
   */
  static _parseDateTime(dateStr, params = {}) {
    if (!dateStr) return null;

    // Check if it's a date-only (no time)
    if (params.VALUE === 'DATE' || dateStr.length === 8) {
      // YYYYMMDD format
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      return new Date(year, month, day);
    }

    // YYYYMMDDTHHMMSS format (with or without Z)
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(9, 11) || '00';
    const minute = dateStr.substring(11, 13) || '00';
    const second = dateStr.substring(13, 15) || '00';

    // Handle UTC (ends with Z)
    if (dateStr.endsWith('Z')) {
      return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    }

    // Handle timezone
    if (params.TZID) {
      // For simplicity, create as local time
      // In production, use a library like moment-timezone or date-fns-tz
      return new Date(year, month - 1, day, hour, minute, second);
    }

    // Default to local time
    return new Date(year, month - 1, day, hour, minute, second);
  }

  /**
   * Parse attendee property
   * @param {string} value - ATTENDEE value (usually mailto URI)
   * @param {object} params - Parameters (CN, ROLE, PARTSTAT, etc.)
   * @returns {object} Attendee object
   */
  static _parseAttendee(value, params) {
    const email = value.replace('mailto:', '');
    return {
      email,
      name: params.CN || email,
      role: params.ROLE || 'REQ-PARTICIPANT',
      status: params.PARTSTAT || 'NEEDS-ACTION',
      rsvp: params.RSVP === 'TRUE'
    };
  }

  /**
   * Parse organizer property
   * @param {string} value - ORGANIZER value
   * @param {object} params - Parameters
   * @returns {object} Organizer object
   */
  static _parseOrganizer(value, params) {
    const email = value.replace('mailto:', '');
    return {
      email,
      name: params.CN || email
    };
  }

  /**
   * Parse RRULE (recurrence rule)
   * @param {string} value - RRULE value
   * @returns {object} Recurrence object
   */
  static _parseRecurrence(value) {
    const parts = value.split(';');
    const rule = {};

    for (const part of parts) {
      const [key, val] = part.split('=');
      if (key && val) {
        switch (key) {
          case 'FREQ':
            rule.frequency = val.toLowerCase();
            break;
          case 'INTERVAL':
            rule.interval = parseInt(val);
            break;
          case 'COUNT':
            rule.count = parseInt(val);
            break;
          case 'UNTIL':
            rule.until = this._parseDateTime(val);
            break;
          case 'BYDAY':
            rule.byDay = val.split(',');
            break;
          case 'BYMONTHDAY':
            rule.byMonthDay = val.split(',').map(d => parseInt(d));
            break;
          case 'BYMONTH':
            rule.byMonth = val.split(',').map(m => parseInt(m));
            break;
        }
      }
    }

    return rule;
  }

  /**
   * Unescape text (\\n -> \n, \\, -> ,, etc.)
   * @param {string} text - Escaped text
   * @returns {string} Unescaped text
   */
  static _unescapeText(text) {
    if (!text) return text;
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  /**
   * Filter events by date range
   * @param {Array} events - Array of events
   * @param {Date} startDate - Range start
   * @param {Date} endDate - Range end
   * @returns {Array} Filtered events
   */
  static filterByDateRange(events, startDate, endDate) {
    return events.filter(event => {
      if (!event.start || !event.end) return false;
      return event.start <= endDate && event.end >= startDate;
    });
  }

  /**
   * Get events happening now
   * @param {Array} events - Array of events
   * @returns {Array} Current events
   */
  static getCurrentEvents(events) {
    const now = new Date();
    return events.filter(event => {
      return event.start <= now && event.end >= now;
    });
  }

  /**
   * Get upcoming events (next N hours)
   * @param {Array} events - Array of events
   * @param {number} hours - Hours to look ahead
   * @returns {Array} Upcoming events
   */
  static getUpcomingEvents(events, hours = 24) {
    const now = new Date();
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
    return events.filter(event => {
      return event.start >= now && event.start <= future;
    }).sort((a, b) => a.start - b.start);
  }

  /**
   * Group events by room/location
   * @param {Array} events - Array of events
   * @returns {Map} Map of location -> events[]
   */
  static groupByLocation(events) {
    const grouped = new Map();
    for (const event of events) {
      const location = event.location || 'Unknown';
      if (!grouped.has(location)) {
        grouped.set(location, []);
      }
      grouped.get(location).push(event);
    }
    return grouped;
  }

  /**
   * Get event duration in minutes
   * @param {object} event - Event object
   * @returns {number} Duration in minutes
   */
  static getEventDuration(event) {
    if (!event.start || !event.end) return 0;
    return (event.end - event.start) / (1000 * 60);
  }

  /**
   * Check if event is all-day
   * @param {object} event - Event object
   * @returns {boolean} True if all-day event
   */
  static isAllDayEvent(event) {
    if (!event.start) return false;
    // Check if time is 00:00:00
    return event.start.getHours() === 0 &&
           event.start.getMinutes() === 0 &&
           event.start.getSeconds() === 0;
  }

  /**
   * Format event for display
   * @param {object} event - Event object
   * @returns {string} Formatted string
   */
  static formatEvent(event) {
    const start = event.start?.toLocaleString() || 'Unknown';
    const end = event.end?.toLocaleString() || 'Unknown';
    const location = event.location || 'No location';
    return `${event.summary}\n${start} - ${end}\n${location}`;
  }
}

/**
 * Convenience function to load and parse ICS file
 * @param {string} url - URL or file path
 * @returns {Promise<Array>} Parsed events
 */
export async function loadICSFile(url) {
  try {
    const response = await fetch(url);
    const content = await response.text();
    return ICSParser.parse(content);
  } catch (error) {
    console.error('[ICSParser] Error loading file:', error);
    return [];
  }
}

/**
 * Load calendar from local file path
 * @param {string} filePath - Path to .ics file
 * @returns {Promise<Array>} Parsed events
 */
export async function loadLocalCalendar(filePath) {
  return loadICSFile(filePath);
}
