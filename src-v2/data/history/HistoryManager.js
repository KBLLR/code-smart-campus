// --- START OF FILE HistoryManager.js (Persistent using localStorage) ---

const MAX_HISTORY_PER_ENTITY = 100; // Max readings per sensor
const MAX_GENERAL_HISTORY = 200; // Max entries in general log
const ENTITY_HISTORY_KEY = "smartCampusHistory_entity"; // localStorage key
const GENERAL_HISTORY_KEY = "smartCampusHistory_general"; // localStorage key

class HistoryManager {
  constructor() {
    this.entityHistory = {};
    this.generalHistory = [];
    this.loadFromStorage(); // Load existing data on initialization
    console.log("[HistoryManager] Initialized (Persistent).");
  }

  /** Loads history data from localStorage */
  loadFromStorage() {
    try {
      const storedEntityHistory = localStorage.getItem(ENTITY_HISTORY_KEY);
      if (storedEntityHistory) {
        this.entityHistory = JSON.parse(storedEntityHistory);
        // Optional: Validate loaded data structure here if needed
        console.log(
          `[HistoryManager] Loaded entity history for ${Object.keys(this.entityHistory).length} entities from localStorage.`,
        );
      }

      const storedGeneralHistory = localStorage.getItem(GENERAL_HISTORY_KEY);
      if (storedGeneralHistory) {
        this.generalHistory = JSON.parse(storedGeneralHistory);
        console.log(
          `[HistoryManager] Loaded ${this.generalHistory.length} general history entries from localStorage.`,
        );
      }
    } catch (error) {
      console.error(
        "[HistoryManager] Error loading history from localStorage:",
        error,
      );
      // Clear potentially corrupted data?
      this.entityHistory = {};
      this.generalHistory = [];
      localStorage.removeItem(ENTITY_HISTORY_KEY);
      localStorage.removeItem(GENERAL_HISTORY_KEY);
    }
  }

  /** Saves the current history data to localStorage */
  saveToStorage() {
    try {
      // Save entity history (can become large, be mindful)
      localStorage.setItem(
        ENTITY_HISTORY_KEY,
        JSON.stringify(this.entityHistory),
      );

      // Save general history
      localStorage.setItem(
        GENERAL_HISTORY_KEY,
        JSON.stringify(this.generalHistory),
      );
      // console.log("[HistoryManager] Saved history to localStorage."); // Log only if needed, can be noisy
    } catch (error) {
      console.error(
        "[HistoryManager] Error saving history to localStorage (maybe storage limit reached?):",
        error,
      );
      // Consider notifying the user or implementing more sophisticated storage if limits are hit
    }
  }

  /** Adds a reading and saves updated history */
  addReading(entityId, state, timestamp) {
    if (!entityId || state === undefined || state === null || !timestamp)
      return;

    const reading = {
      state: state,
      timestamp:
        timestamp instanceof Date ? timestamp.toISOString() : timestamp,
    };

    // Per-Entity History
    if (!this.entityHistory[entityId]) this.entityHistory[entityId] = [];
    const history = this.entityHistory[entityId];
    history.push(reading);
    if (history.length > MAX_HISTORY_PER_ENTITY) history.shift();

    // General History Log
    this.generalHistory.push({ entityId: entityId, ...reading });
    if (this.generalHistory.length > MAX_GENERAL_HISTORY)
      this.generalHistory.shift();

    // --- Save after adding ---
    this.saveToStorage();
  }

  getHistory(entityId) {
    return this.entityHistory[entityId] || [];
  }
  getGeneralHistory() {
    return this.generalHistory;
  }

  /** Clears history for an entity and updates storage */
  clearEntityHistory(entityId) {
    if (this.entityHistory[entityId]) {
      delete this.entityHistory[entityId];
      this.saveToStorage(); // Update storage after clearing
      console.log(
        `[HistoryManager] Cleared history for ${entityId} and saved.`,
      );
    }
  }

  /** Clears all history and updates storage */
  clearAllHistory() {
    this.entityHistory = {};
    this.generalHistory = [];
    // --- Update storage after clearing ---
    try {
      localStorage.removeItem(ENTITY_HISTORY_KEY);
      localStorage.removeItem(GENERAL_HISTORY_KEY);
      console.log(
        "[HistoryManager] Cleared all history and removed from localStorage.",
      );
    } catch (error) {
      console.error(
        "[HistoryManager] Error removing history from localStorage:",
        error,
      );
    }
  }

  /** Adds initial states without flooding history */
  addInitialStates(states) {
    if (!Array.isArray(states)) return;
    console.log(
      `[HistoryManager] Processing initial states for history (${states.length} total).`,
    );
    let addedCount = 0;
    const now = new Date().toISOString();
    states.forEach((entity) => {
      if (
        entity &&
        entity.entity_id &&
        entity.state !== undefined &&
        entity.state !== null
      ) {
        if (!this.entityHistory[entity.entity_id]) {
          // Only add if no history exists
          const timestamp = entity.last_changed || now;
          // Call internal add without saving immediately
          this._addReadingInternal(entity.entity_id, entity.state, timestamp);
          addedCount++;
        }
      }
    });
    if (addedCount > 0) {
      this.saveToStorage(); // Save once after processing all initial states
      console.log(
        `[HistoryManager] Added initial history for ${addedCount} new entities and saved.`,
      );
    }
  }

  // Internal helper to add reading without saving (for bulk operations like initial load)
  _addReadingInternal(entityId, state, timestamp) {
    const reading = { state: state, timestamp: timestamp };
    // Per-Entity History
    if (!this.entityHistory[entityId]) this.entityHistory[entityId] = [];
    this.entityHistory[entityId].push(reading);
    if (this.entityHistory[entityId].length > MAX_HISTORY_PER_ENTITY)
      this.entityHistory[entityId].shift();
    // General History Log
    this.generalHistory.push({ entityId: entityId, ...reading });
    if (this.generalHistory.length > MAX_GENERAL_HISTORY)
      this.generalHistory.shift();
  }
}

const historyManager = new HistoryManager();
export default historyManager;

// --- END OF FILE HistoryManager.js (Persistent using localStorage) ---
