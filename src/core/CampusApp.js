/**
 * CampusApp — Smart Campus orchestrator (Core-X shell).
 *
 * Data flow
 *   campus.glb ──GLBLoader──▶ room meshes ─┐
 *   unified_rooms_data.js ─────────────────┼─▶ buildRoomIndex() ─▶ CampusState (single selection truth)
 *   classrooms-with-sensors.js ────────────┘                          │
 *       ┌─────────────────────────────┬───────────────────────────────┼──────────────────────┐
 *   CampusPresentation (3D emphasis)  CampusPoint3DSystem (Space.js)  CampusShell (chrome)   ClassroomWorkspace
 *
 * Shared services are reached only through src/lanes/corexLanes.js. Telemetry
 * comes from the existing Home Assistant connector and is reported honestly
 * (src/campus/telemetry.js). Nothing here performs device control.
 */
import * as THREE from 'three';

import { GLBLoader } from '../loaders/GLBLoader.js';
import { HomeAssistantConnector } from '../connectors/HomeAssistantConnector.js';
import { classroomRegistry } from '../models/ClassroomRegistry.js';
import classroomsWithSensors from '../data/classrooms/classrooms-with-sensors.js';
import { unifiedRooms } from '../data/personalities/unified_rooms_data.js';

import { World } from '../3d/core/World.js';
import { Renderer } from '../3d/core/Renderer.js';
import { CameraManager } from '../3d/core/CameraManager.js';
import { InputManager } from '../3d/core/InputManager.js';

import { buildRoomIndex } from '../campus/roomIdentity.js';
import { CampusState, LEVELS } from '../campus/CampusState.js';
import { deriveRoomTelemetry, resolveSourceState, SOURCE_STATES } from '../campus/telemetry.js';
import { buildPreviewReadings, isPreviewRequested } from '../campus/previewFixtures.js';
import { askRoomAgent, LANE_STATES, probeLane, resolveLaneConfig } from '../lanes/corexLanes.js';
import { CampusPresentation } from '../scene/CampusPresentation.js';
import { createCorexLighting } from '../scene/lighting.js';
import { FRAMING, azimuthOf, frameBox } from '../scene/cameraFraming.js';
import { CampusPoint3DSystem } from '../ui/spacejs/CampusPoint3DSystem.js';
import { CampusShell } from '../shell/CampusShell.js';
import { ClassroomWorkspace } from '../shell/ClassroomWorkspace.js';
import { prefersReducedMotion } from '../shell/dom.js';

const OVERVIEW_AZIMUTH = Math.PI / 4;
const LANE_PROBE_INTERVAL_MS = 30000;
const TELEMETRY_TICK_MS = 2000;

function setLoadingProgress(fraction) {
  const bar = document.getElementById('sc-stage-progress');
  const text = document.getElementById('sc-stage-status-text');
  if (!bar || !Number.isFinite(fraction)) return;
  bar.dataset.indeterminate = 'false';
  bar.style.setProperty('--sc-progress', `${Math.round(fraction * 100)}%`);
  if (text) text.textContent = `Loading campus.glb… ${Math.round(fraction * 100)}%`;
}

export class CampusApp {
  constructor(options = {}) {
    this.canvas = options.canvas;
    this.modelPath = options.modelPath || '/models/campus.glb';
    this.env = options.env || {};
    this.search = options.search ?? window.location.search;

    this.reducedMotion = prefersReducedMotion();
    this.preview = isPreviewRequested(this.search);
    this.forceNoRender = new URLSearchParams(this.search).get('render') === 'off';
    this.laneConfig = resolveLaneConfig(this.env);

    this.classroomRegistry = classroomRegistry;
    this.isRunning = false;
    this.clock = new THREE.Clock();
    this.laneStatus = {};
    this.readings = new Map(); // entityId -> { state, unit, updatedAt }
    this.telemetry = { configured: this.env.VITE_SMARTCAMPUS_TELEMETRY !== 'off', errored: false, startedAt: null };
    this._timers = [];
  }

  // ---------------------------------------------------------------------------
  // Lifecycle

  async init() {
    this._loadClassroomData();

    let model = null;
    let renderProblem = null;
    let modelError = null;

    if (this.forceNoRender) renderProblem = 'The 3D view is turned off (?render=off).';
    else if (!Renderer.isWebGLAvailable()) renderProblem = 'WebGL is not available in this browser or device.';

    if (!renderProblem) {
      try {
        this._setupCore();
      } catch (err) {
        renderProblem = `The WebGL renderer could not start (${err?.message || err}).`;
      }
    }

    if (!renderProblem) {
      try {
        this.glbLoader = new GLBLoader(this.world.scene);
        model = await this.glbLoader.load(this.modelPath, setLoadingProgress);
      } catch (err) {
        modelError = err?.message || String(err);
      }
    }

    // Room identity: from the loaded model when available, otherwise from room data
    // so the navigator and classroom workspace still work without the 3D view.
    const meshIds = model ? model.rooms.map((r) => r.id) : unifiedRooms.map((r) => r.id);
    this.roomIndex = buildRoomIndex({ meshIds, unifiedRooms, classrooms: classroomsWithSensors });
    if (this.roomIndex.unmatchedMeshes.length) console.warn('[CampusApp] Meshes without room data:', this.roomIndex.unmatchedMeshes);
    this.state = new CampusState(this.roomIndex);

    if (model) this._setupScene(model);

    this._setupShell();

    if (renderProblem) this.shell.setRenderUnavailable(renderProblem);
    else if (modelError) this.shell.setModelError(modelError);
    else this.shell.setReady();

    this._setupTelemetry();
    this._setupLanes();
    this._bindState();
    this._setupEventListeners();

    this.state.applyHash(window.location.hash);
    if (this.cameraManager && this.state.level === LEVELS.OVERVIEW) this._frame(this.state.snapshot(), { instant: true });
  }

  start() {
    if (this.isRunning || !this.renderer) return;
    this.isRunning = true;
    this._animate();
  }

  stop() {
    this.isRunning = false;
  }

  dispose() {
    this.stop();
    this._timers.forEach((t) => clearInterval(t));
    this.shell?.dispose();
    this.workspace?.dispose();
    this.campusPoint3D?.dispose();
    this.presentation?.dispose();
    this.haConnector?.stop?.();
    this.inputManager?.dispose();
    this.cameraManager?.dispose();
    this.renderer?.dispose();
    this.world?.dispose();
  }

  // ---------------------------------------------------------------------------
  // Setup

  _loadClassroomData() {
    if (this.classroomRegistry.count) return;
    classroomsWithSensors.forEach((room) => this.classroomRegistry.register(room));
  }

  _setupCore() {
    this.world = new World({ legacyLighting: false });
    this.renderer = new Renderer({
      canvas: this.canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      toneMapping: THREE.NeutralToneMapping,
    });
    this.renderer.renderer.shadowMap.enabled = true;
    this.cameraManager = new CameraManager({
      width: window.innerWidth,
      height: window.innerHeight,
      domElement: this.renderer.domElement,
    });
    this.inputManager = new InputManager(this.cameraManager.getCamera(), this.renderer.domElement);
  }

  _setupScene(model) {
    this.model = model;
    this.presentation = new CampusPresentation({ model, roomIndex: this.roomIndex, reducedMotion: this.reducedMotion });
    this.campusBox = this.presentation.campusBox();
    this.world.scene.add(createCorexLighting(this.campusBox));

    const meshes = [...this.presentation.entries.values()].map((e) => e.mesh);
    const buttons = [...this.presentation.buttonEntries.values()].map((e) => e.mesh);
    this.inputManager.registerLayer('rooms', meshes);
    this.inputManager.registerLayer('legend', buttons);
    this.inputManager.on('hover', (hit) => this._onInputHover(hit));
    this.inputManager.on('click', (hit) => this._onInputClick(hit));

    const controls = this.cameraManager.controls;
    const radius = this.campusBox.getBoundingSphere(new THREE.Sphere()).radius;
    controls.maxDistance = radius * 4;
    this.cameraManager.getCamera().far = radius * 12;
    this.cameraManager.getCamera().updateProjectionMatrix();

    this.campusPoint3D = new CampusPoint3DSystem(this.world.scene, this.cameraManager.getCamera(), {
      roomIndex: this.roomIndex,
      presentation: this.presentation,
      state: this.state,
      container: document.getElementById('sc-labels'),
    });
  }

  _setupShell() {
    this.shell = new CampusShell({
      state: this.state,
      roomIndex: this.roomIndex,
      onCategoryFilter: (category) => this.presentation?.setCategoryFilter(category),
      onLabelsToggle: (on) => this.campusPoint3D?.setLabelsEnabled(on),
    });
    this.workspace = new ClassroomWorkspace({
      element: document.getElementById('sc-workspace'),
      state: this.state,
      getTelemetry: (room) => this._telemetryFor(room),
      getGatewayStatus: () => this.laneStatus.gateway || { state: LANE_STATES.CHECKING, detail: 'Checking Gateway…' },
      ask: ({ room, telemetry, question }) => askRoomAgent({ config: this.laneConfig, room, telemetry, question }),
    });
    document.getElementById('sc-preview-banner').hidden = !this.preview;
  }

  // ---------------------------------------------------------------------------
  // Telemetry (existing Home Assistant connector; honest states)

  _setupTelemetry() {
    if (this.preview) {
      this.readings = buildPreviewReadings(this.roomIndex);
      this._updateTelemetryStatus();
      return;
    }
    if (!this.telemetry.configured) {
      this._updateTelemetryStatus();
      return;
    }

    const ha = new HomeAssistantConnector({
      url: this.env.VITE_CLOUD_WS || this.env.VITE_LOCAL_WS || this.env.VITE_HA_URL,
    });
    this.haConnector = ha;
    const ingest = ({ entityId, state, unit, lastUpdated }) => {
      if (!entityId) return;
      const parsed = lastUpdated ? Date.parse(lastUpdated) : NaN;
      this.readings.set(entityId, { state, unit, updatedAt: Number.isFinite(parsed) ? parsed : null });
    };
    ha.on('sensorDiscovered', ingest);
    ha.on('stateChanged', ingest);
    ha.on('error', () => { this.telemetry.errored = true; });

    this.telemetry.startedAt = Date.now();
    ha.start().catch(() => { this.telemetry.errored = true; });
    this._updateTelemetryStatus();
    this._timers.push(setInterval(() => this._updateTelemetryStatus(), TELEMETRY_TICK_MS));
  }

  _telemetrySource() {
    return resolveSourceState({
      configured: this.telemetry.configured,
      preview: this.preview,
      readingsCount: this.readings.size,
      errored: this.telemetry.errored,
      startedAt: this.telemetry.startedAt,
    });
  }

  _telemetryFor(room) {
    return deriveRoomTelemetry(room, { source: this._telemetrySource(), readings: this.readings });
  }

  _updateTelemetryStatus() {
    const source = this._telemetrySource();
    const detail = {
      [SOURCE_STATES.LIVE]: `Home Assistant: ${this.readings.size} entities reporting.`,
      [SOURCE_STATES.CONNECTING]: 'Connecting to Home Assistant through the dev proxy…',
      [SOURCE_STATES.OFFLINE]: 'Home Assistant did not deliver readings (proxy or service unavailable).',
      [SOURCE_STATES.UNCONFIGURED]: 'Telemetry disabled for this build (VITE_SMARTCAMPUS_TELEMETRY=off).',
      [SOURCE_STATES.PREVIEW]: 'Preview fixtures only (?preview=fixture). Not live.',
    }[source];
    const signature = `${source}:${this.readings.size}`;
    this.shell.setLaneStatus({ telemetry: { state: source, detail } });
    if (signature !== this._telemetrySignature) {
      this._telemetrySignature = signature;
      this.workspace.refresh();
    }
  }

  // ---------------------------------------------------------------------------
  // Core-X lanes

  _setupLanes() {
    const { lanes } = this.laneConfig;
    const initial = {};
    for (const [id, lane] of Object.entries(lanes)) {
      initial[id] = { state: LANE_STATES.CHECKING, detail: `Checking ${lane.label}…`, url: lane.url, source: lane.source };
    }
    this.laneStatus = initial;
    this.shell.setLaneStatus(initial);
    const probeAll = async () => {
      const results = await Promise.all(Object.values(lanes).map((lane) => probeLane(lane)));
      const next = {};
      results.forEach((r) => {
        const lane = lanes[r.id];
        next[r.id] = { state: r.state, detail: r.detail, url: lane.url, source: lane.source };
      });
      const changed = JSON.stringify(next.gateway?.state) !== JSON.stringify(this.laneStatus.gateway?.state);
      this.laneStatus = { ...this.laneStatus, ...next };
      this.shell.setLaneStatus(next);
      if (changed) this.workspace.refresh();
    };
    probeAll();
    this._timers.push(setInterval(probeAll, LANE_PROBE_INTERVAL_MS));
  }

  // ---------------------------------------------------------------------------
  // State → scene / camera / URL

  _bindState() {
    this.state.subscribe((snap, meta) => {
      this.presentation?.setEmphasis(snap);
      if (meta.reason === 'hover') return;
      const hash = this.state.toHash();
      if (hash !== window.location.hash && !(hash === '' && !window.location.hash)) {
        history.replaceState(null, '', hash || window.location.pathname + window.location.search);
      }
      // Wait one frame so the workspace/rail layout is final before measuring insets.
      requestAnimationFrame(() => this._frame(snap, { instant: meta.source === 'hash' && !this._framedOnce }));
    });
  }

  _frame(snap, { instant = false } = {}) {
    if (!this.cameraManager || !this.presentation) return;
    const camera = this.cameraManager.getCamera();
    let box = null;
    let preset = FRAMING.overview;
    if (snap.level === LEVELS.ROOM) {
      box = this.presentation.roomBox(snap.roomId);
      preset = FRAMING.room;
    } else if (snap.level === LEVELS.AREA) {
      box = this.presentation.areaBox(snap.areaName);
      preset = FRAMING.area;
    }
    if (!box) {
      box = this.campusBox;
      preset = FRAMING.overview;
    }
    const azimuth = snap.level === LEVELS.OVERVIEW
      ? OVERVIEW_AZIMUTH
      : azimuthOf(camera.position, this.cameraManager.controls.target);
    const { position, target } = frameBox({
      box,
      fovDeg: camera.fov,
      aspect: camera.aspect,
      azimuth,
      ...preset,
      inset: this.shell.viewportInsets(),
    });
    const duration = instant || this.reducedMotion ? 0 : 1.1;
    this.cameraManager.transitionTo(position, target, duration);
    this._framedOnce = true;
  }

  _setupEventListeners() {
    window.addEventListener('resize', () => this._onResize());
    window.addEventListener('hashchange', () => {
      if (window.location.hash !== this.state.toHash()) this.state.applyHash(window.location.hash);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
      else this.start();
    });
  }

  _onResize() {
    if (!this.renderer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.cameraManager.resize(w, h);
    clearTimeout(this._resizeTimer);
    this._resizeTimer = setTimeout(() => this._frame(this.state.snapshot(), { instant: true }), 150);
  }

  // ---------------------------------------------------------------------------
  // Pointer input on the 3D view

  _roomIdFromHit(hit) {
    const id = hit?.object?.userData?.roomId;
    return id && this.roomIndex.rooms.has(id) ? id : null;
  }

  _onInputHover(hit) {
    const roomId = this._roomIdFromHit(hit);
    this.state.hover(roomId);
    const selectable = roomId && this.state.isSelectable(roomId);
    const isButton = Boolean(hit?.object && this.presentation.categoryForMesh(hit.object));
    this.renderer.domElement.style.cursor = selectable || isButton ? 'pointer' : 'grab';
  }

  _onInputClick(hit) {
    if (!hit) return;
    const category = this.presentation.categoryForMesh(hit.object);
    if (category) {
      this.shell.setCategoryFilter(category);
      return;
    }
    const roomId = this._roomIdFromHit(hit);
    if (roomId) this.state.selectRoom(roomId, 'mesh');
  }

  // ---------------------------------------------------------------------------
  // Frame loop

  _animate() {
    if (!this.isRunning) return;
    requestAnimationFrame(() => this._animate());

    const delta = this.clock.getDelta();
    const time = performance.now();

    this.cameraManager.update(delta);
    this.world.update(delta, time);
    this.presentation?.update(delta);
    this.campusPoint3D?.update(time);

    this.renderer.clear();
    this.renderer.render(this.world.scene, this.cameraManager.getCamera());
  }
}
