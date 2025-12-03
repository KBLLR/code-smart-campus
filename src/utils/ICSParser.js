/**
 * Simple ICS Parser
 * Parses .ics files to extract events
 */

export class ICSParser {
    /**
     * Parse ICS content string
     * @param {string} content 
     * @returns {Array} Array of event objects
     */
    static parse(content) {
        const lines = content.split(/\r\n|\n|\r/);
        const events = [];
        let currentEvent = null;

        for (const line of lines) {
            if (line.startsWith('BEGIN:VEVENT')) {
                currentEvent = {};
            } else if (line.startsWith('END:VEVENT')) {
                if (currentEvent) {
                    events.push(currentEvent);
                    currentEvent = null;
                }
            } else if (currentEvent) {
                const [key, ...valueParts] = line.split(':');
                const value = valueParts.join(':');

                if (key.startsWith('DTSTART')) {
                    currentEvent.start = this._parseDate(value);
                } else if (key.startsWith('DTEND')) {
                    currentEvent.end = this._parseDate(value);
                } else if (key.startsWith('SUMMARY')) {
                    currentEvent.summary = value;
                } else if (key.startsWith('DESCRIPTION')) {
                    currentEvent.description = value;
                } else if (key.startsWith('LOCATION')) {
                    currentEvent.location = value;
                }
            }
        }

        return events;
    }

    static _parseDate(dateStr) {
        if (!dateStr) return null;
        // Basic parsing for YYYYMMDDTHHMMSSZ format
        // TODO: Handle timezones properly if needed
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const hour = dateStr.substring(9, 11);
        const minute = dateStr.substring(11, 13);
        const second = dateStr.substring(13, 15);

        return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    }
}
