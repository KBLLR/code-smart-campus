import { createHomeAssistantSocket } from "@network/HomeAssistantSocket.js";
import { resolveRoomMeta } from "@data/mappings/roomEntityMapping.js";

const DEFAULT_WS_URL =
  import.meta.env.VITE_CLOUD_WS ||
  import.meta.env.VITE_LOCAL_WS ||
  "ws://localhost:8123/api/websocket";
const DEFAULT_HA_TOKEN = import.meta.env.VITE_HA_TOKEN;

const NUMERIC_STATE_REGEX = /^-?\d+(\.\d+)?$/;

/**
 * @typedef {Object} NormalisedEntity
 * @property {string} entityId
 * @property {string} domain
 * @property {string | undefined} deviceClass
 * @property {string} state
 * @property {number | undefined} numericValue
 * @property {string | undefined} unit
 * @property {string | undefined} friendlyName
 * @property {string | undefined} lastChanged
 * @property {string | undefined} lastUpdated
 * @property {Record<string, unknown>} attributes
 * @property {string | null} roomId
 * @property {string | null} roomName
 * @property {string | null} category
 * @property {number | null} priority
 * @property {string | null} icon
 * @property {string[]} tags
 * @property {("ws" | "rest" | "synthetic")} source
 */

export class DataPipeline extends EventTarget {
  /**
   * @param {{ url?: string, token?: string }} [options]
   */
  constructor({ url = DEFAULT_WS_URL, token = DEFAULT_HA_TOKEN } = {}) {
    super();
    this.url = url;
    this.token = token;

    /** @type {Map<string, object>} */
    this.rawEntities = new Map();
    /** @type {Map<string, NormalisedEntity>} */
    this.normalisedEntities = new Map();

    this.transport = null;
    this.socket = null;

    this.initialised = false;
    this._initialiseDeferred = this._createDeferred();
  }

  /**
   * Establishes the Home Assistant websocket connection.
   * Subsequent calls return the active socket.
   * @returns {WebSocket | null}
   */
  connect() {
    if (!this.url) {
      console.error("[DataPipeline] WebSocket URL is not defined.");
      return null;
    }

    if (this.transport) {
      return this.socket;
    }

    this.transport = createHomeAssistantSocket({
      url: this.url,
      token: this.token,
      onInitialStates: (states) => this._handleInitialStates(states),
      onStateUpdate: (_entityId, entity) =>
        this._handleEntityUpdate(entity, "ws"),
    });

    this.socket = this.transport.connect();
    if (this.socket) {
      this._wireSocketLifecycle(this.socket);
    } else {
      console.warn(
        "[DataPipeline] Socket controller did not return a WebSocket instance.",
      );
    }
    return this.socket;
  }

  /**
   * Disconnects the websocket connection.
   */
  disconnect() {
    this.transport?.disconnect();
    this.transport = null;
    this.socket = null;
    this.initialised = false;
    this._initialiseDeferred = this._createDeferred();
  }

  /**
   * Attaches a listener for pipeline events.
   * Returns an unsubscribe function.
   * @param {string} type
   * @param {(event: CustomEvent) => void} listener
   * @param {boolean | AddEventListenerOptions} [options]
   * @returns {() => void}
   */
  on(type, listener, options) {
    this.addEventListener(type, listener, options);
    return () => this.removeEventListener(type, listener, options);
  }

  /**
   * Resolve when the initial state dump has been processed.
   * @returns {Promise<NormalisedEntity[]>}
   */
  untilInitialised() {
    return this._initialiseDeferred.promise;
  }

  /**
   * @returns {NormalisedEntity[]}
   */
  getEntities() {
    return Array.from(this.normalisedEntities.values()).map((entity) => ({
      ...entity,
      attributes: { ...entity.attributes },
    }));
  }

  /**
   * @param {string} entityId
   * @returns {NormalisedEntity | null}
   */
  getEntity(entityId) {
    const entry = this.normalisedEntities.get(entityId);
    if (!entry) return null;
    return {
      ...entry,
      attributes: { ...entry.attributes },
    };
  }

  /**
   * @param {string} entityId
   * @returns {object | null}
   */
  getRawEntity(entityId) {
    const entry = this.rawEntities.get(entityId);
    return entry ? { ...entry } : null;
  }

  /**
   * @returns {WebSocket | null}
   */
  getSocket() {
    return this.socket ?? this.transport?.getSocket?.() ?? null;
  }

  /**
   * @private
   * @param {WebSocket} socket
   */
  _wireSocketLifecycle(socket) {
    socket.addEventListener("open", () => {
      this.dispatchEvent(new CustomEvent("socket-open"));
    });
    socket.addEventListener("close", (event) => {
      this.dispatchEvent(
        new CustomEvent("socket-close", {
          detail: { code: event.code, reason: event.reason },
        }),
      );
    });
    socket.addEventListener("error", (event) => {
      this.dispatchEvent(new CustomEvent("socket-error", { detail: event }));
    });
  }

  /**
   * @private
   * @param {Array<object>} states
   */
  _handleInitialStates(states) {
    if (!Array.isArray(states)) {
      console.error(
        "[DataPipeline] Ignoring invalid initial states payload:",
        states,
      );
      return;
    }

    this.rawEntities.clear();
    this.normalisedEntities.clear();

    states.forEach((entity) => {
      if (!entity?.entity_id) return;
      this.rawEntities.set(entity.entity_id, entity);
      const normalised = this._normaliseEntity(entity, "rest");
      this.normalisedEntities.set(entity.entity_id, normalised);
    });

    this.initialised = true;
    const snapshot = this.getEntities();
    this._initialiseDeferred.resolve(snapshot);

    this.dispatchEvent(
      new CustomEvent("initialised", {
        detail: {
          entities: snapshot,
          raw: states.map((entity) => ({ ...entity })),
        },
      }),
    );
  }

  /**
   * @private
   * @param {object} entity
   * @param {"ws" | "rest" | "synthetic"} source
   */
  _handleEntityUpdate(entity, source) {
    if (!entity?.entity_id) return;

    this.rawEntities.set(entity.entity_id, entity);
    const normalised = this._normaliseEntity(entity, source);
    this.normalisedEntities.set(entity.entity_id, normalised);

    this.dispatchEvent(
      new CustomEvent("entity-update", {
        detail: {
          entityId: entity.entity_id,
          entity: { ...normalised, attributes: { ...normalised.attributes } },
          raw: { ...entity },
        },
      }),
    );
  }

  /**
   * @private
   * @param {object} entity
   * @param {"ws" | "rest" | "synthetic"} source
   * @returns {NormalisedEntity}
   */
  _normaliseEntity(entity, source) {
    const entityId = entity.entity_id;
    const [domain = "", objectId = ""] = entityId.split(".");
    const attributes = entity.attributes || {};
    const deviceClass = attributes.device_class || attributes.deviceClass;
    const friendlyName =
      attributes.friendly_name || attributes.friendlyName || entityId;
    const unit =
      attributes.unit_of_measurement || attributes.unit || undefined;

    let numericValue;
    if (typeof entity.state === "number") {
      numericValue = entity.state;
    } else if (
      typeof entity.state === "string" &&
      NUMERIC_STATE_REGEX.test(entity.state.trim())
    ) {
      numericValue = Number(entity.state);
    } else {
      numericValue = undefined;
    }

    const roomMeta = resolveRoomMeta({
      entityId,
      friendlyName,
    });

    const roomId = roomMeta?.roomId ?? null;
    const roomName = roomMeta?.title ?? null;
    const tags = new Set();
    if (roomId) tags.add(`room:${roomId}`);
    roomMeta?.tags?.forEach?.((tag) => tags.add(tag));

    return {
      entityId,
      domain,
      deviceClass,
      state: entity.state,
      numericValue: Number.isFinite(numericValue) ? numericValue : undefined,
      unit,
      friendlyName,
      lastChanged: entity.last_changed,
      lastUpdated: entity.last_updated,
      attributes: { ...attributes },
      roomId,
      roomName,
      category: null,
      priority: null,
      icon: null,
      tags: Array.from(tags),
      source,
    };
  }

  /**
   * @private
   */
  _createDeferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    // @ts-ignore - resolve is assigned synchronously above
    return { promise, resolve, reject };
  }
}

export const dataPipeline = new DataPipeline();
