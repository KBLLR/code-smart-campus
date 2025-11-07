import { RaycasterHandler } from "@three/RaycasterHandler.js";

const normalizeRoomKey = (value) =>
  typeof value === "string" ? value.toLowerCase().replace(/[^a-z0-9]/g, "") : null;

export class RoomSelectionController {
  constructor({
    camera,
    scene,
    domElement,
    getRoomMeshes,
    getEntityIdForRoom,
    onHoverRoom,
    onHoverOut,
    onSelectRoom,
    onSelectClear,
  } = {}) {
    if (!camera || !scene || !domElement) {
      throw new Error(
        "[RoomSelectionController] camera, scene, and domElement are required.",
      );
    }

    this.domElement = domElement;
    this.getRoomMeshes = getRoomMeshes ?? (() => ({}));
    this.getEntityIdForRoom = getEntityIdForRoom ?? (() => null);
    this.onHoverRoom = onHoverRoom ?? (() => {});
    this.onHoverOut = onHoverOut ?? (() => {});
    this.onSelectRoom = onSelectRoom ?? (() => {});
    this.onSelectClear = onSelectClear ?? (() => {});

    this.handler = new RaycasterHandler(camera, scene, domElement);

    this.handleHoverIn = this.handleHoverIn.bind(this);
    this.handleHoverOut = this.handleHoverOut.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleClickOff = this.handleClickOff.bind(this);

    this.domElement.addEventListener("raycasterhoverin", this.handleHoverIn);
    this.domElement.addEventListener("raycasterhoverout", this.handleHoverOut);
    this.domElement.addEventListener("raycasterclick", this.handleClick);
    this.domElement.addEventListener("raycasterclickoff", this.handleClickOff);

    this.lastHover = null;
    this.lastSelection = null;

    this.updateInteractiveMeshes();
  }

  updateEntityResolver(resolver) {
    this.getEntityIdForRoom = resolver ?? (() => null);
  }

  updateInteractiveMeshes() {
    this.handler.clearInteractiveObjects();
    const meshes = this.getRoomMeshes?.();
    const pool = Array.isArray(meshes)
      ? meshes
      : Object.values(meshes ?? {});
    if (pool.length) {
      this.handler.addInteractiveObjects(
        pool.filter((mesh) => mesh && mesh.isObject3D),
      );
    }
  }

  dispose() {
    this.domElement.removeEventListener("raycasterhoverin", this.handleHoverIn);
    this.domElement.removeEventListener(
      "raycasterhoverout",
      this.handleHoverOut,
    );
    this.domElement.removeEventListener("raycasterclick", this.handleClick);
    this.domElement.removeEventListener(
      "raycasterclickoff",
      this.handleClickOff,
    );
    this.handler.dispose();
    this.lastHover = null;
    this.lastSelection = null;
  }

  extractRoomKey(object) {
    return object?.userData?.roomKey || object?.name || null;
  }

  buildPayload(object) {
    const rawKey = this.extractRoomKey(object);
    const roomKey = normalizeRoomKey(rawKey);
    const entityId = roomKey
      ? this.getEntityIdForRoom?.(roomKey) ?? null
      : null;
    return {
      roomKey,
      entityId,
      object,
    };
  }

  handleHoverIn(event) {
    const payload = this.buildPayload(event.detail?.object);
    if (!payload.roomKey) return;
    this.lastHover = payload;
    this.onHoverRoom(payload);
  }

  handleHoverOut() {
    if (!this.lastHover) return;
    this.onHoverOut(this.lastHover);
    this.lastHover = null;
  }

  handleClick(event) {
    const payload = this.buildPayload(event.detail?.object);
    if (!payload.roomKey) return;
    this.lastSelection = payload;
    this.onSelectRoom(payload);
  }

  handleClickOff() {
    if (!this.lastSelection) {
      this.onSelectClear();
      return;
    }
    this.onSelectClear(this.lastSelection);
    this.lastSelection = null;
  }
}
