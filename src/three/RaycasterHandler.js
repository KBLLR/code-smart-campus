// src/ui/components/RaycasterHandler.js

import * as THREE from "three";

class RaycasterHandler {
  /**
   * Creates an instance of RaycasterHandler.
   * @param {THREE.PerspectiveCamera | THREE.OrthographicCamera} camera - The camera used for raycasting.
   * @param {THREE.Scene} scene - The main scene object (optional, primarily used if checking scene.children directly).
   * @param {HTMLCanvasElement} domElement - The canvas element to attach event listeners to.
   */
  constructor(camera, scene, domElement) {
    if (!camera || !scene || !domElement) {
      throw new Error(
        "RaycasterHandler requires camera, scene, and domElement.",
      );
    }

    this.camera = camera;
    this.scene = scene; // Keep reference, though we primarily use interactiveObjects array
    this.domElement = domElement;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(); // Reusable vector for normalized device coordinates

    // --- State ---
    this.interactiveObjects = []; // Array of THREE.Object3D to check intersections against
    this.currentlyHoveredObject = null;

    // --- Bind event handlers to maintain 'this' context ---
    // Using arrow functions automatically binds 'this'
    this.onPointerMove = (event) => {
      const rect = this.domElement.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.checkIntersections("pointermove");
    };

    this.onPointerDown = (event) => {
      // Ensure coordinates are up-to-date for the click location
      const rect = this.domElement.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.checkIntersections("pointerdown", event); // Pass original event for context
    };

    // --- Attach listeners ---
    this.domElement.addEventListener("pointermove", this.onPointerMove);
    this.domElement.addEventListener("pointerdown", this.onPointerDown);
    // Consider 'pointerup' if you need to detect a full click vs. just the down event
  }

  /**
   * Adds one or more objects to the list that the raycaster will check for intersections.
   * @param {THREE.Object3D | THREE.Object3D[]} objects - The object or array of objects to make interactive.
   */
  addInteractiveObjects(objects) {
    const objectsToAdd = Array.isArray(objects) ? objects : [objects];
    objectsToAdd.forEach((obj) => {
      if (
        obj instanceof THREE.Object3D &&
        !this.interactiveObjects.includes(obj)
      ) {
        this.interactiveObjects.push(obj);
        // console.log(`Raycaster added: ${obj.name || obj.uuid}`);
      } else if (!(obj instanceof THREE.Object3D)) {
        console.warn(
          "RaycasterHandler: Attempted to add non-Object3D item:",
          obj,
        );
      }
    });
    // console.log("Raycaster interactive pool size:", this.interactiveObjects.length);
  }

  /**
   * Removes one or more objects from the list of interactive objects.
   * @param {THREE.Object3D | THREE.Object3D[]} objects - The object or array of objects to remove.
   */
  removeInteractiveObjects(objects) {
    const objectsToRemove = Array.isArray(objects) ? objects : [objects];
    const idsToRemove = objectsToRemove.map((obj) => obj.uuid);
    this.interactiveObjects = this.interactiveObjects.filter(
      (obj) => !idsToRemove.includes(obj.uuid),
    );
  }

  /**
   * Clears all interactive objects.
   */
  clearInteractiveObjects() {
    this.interactiveObjects = [];
    this.currentlyHoveredObject = null; // Reset hover state
  }

  /**
   * Performs the raycasting check and handles hover/click events.
   * @param {string} eventType - The type of DOM event ('pointermove' or 'pointerdown').
   * @param {PointerEvent} [originalDomEvent] - The original DOM event (useful for 'pointerdown').
   */
  checkIntersections(eventType, originalDomEvent = null) {
    if (this.interactiveObjects.length === 0) {
      // If nothing is hovered currently, ensure hover out is handled
      if (this.currentlyHoveredObject) {
        this.dispatchCustomEvent("raycasterhoverout", {
          object: this.currentlyHoveredObject,
        });
        this.currentlyHoveredObject = null;
      }
      return; // No objects to check
    }

    // Update the picking ray with the camera and pointer position
    this.raycaster.setFromCamera(this.pointer, this.camera);

    // Calculate objects intersecting the picking ray
    // false = do not check descendants if a parent is in interactiveObjects (usually correct if adding meshes directly)
    // Set to true if adding groups and want to intersect children meshes.
    const intersects = this.raycaster.intersectObjects(
      this.interactiveObjects,
      false,
    );

    let firstVisibleIntersectedObject = null;
    if (intersects.length > 0) {
      // Find the closest *visible* object
      for (const intersect of intersects) {
        if (intersect.object.visible) {
          firstVisibleIntersectedObject = intersect.object;
          break; // Take the first one (closest)
        }
      }
    }

    // --- Handle Hover (on pointermove) ---
    if (eventType === "pointermove") {
      if (firstVisibleIntersectedObject !== this.currentlyHoveredObject) {
        // Hover Out on the previous object
        if (this.currentlyHoveredObject) {
          this.dispatchCustomEvent("raycasterhoverout", {
            object: this.currentlyHoveredObject,
          });
          // console.log('Hover Out:', this.currentlyHoveredObject.userData?.roomId || this.currentlyHoveredObject.name);
        }

        // Hover In on the new object
        if (firstVisibleIntersectedObject) {
          this.dispatchCustomEvent("raycasterhoverin", {
            object: firstVisibleIntersectedObject,
          });
          // console.log('Hover In:', firstVisibleIntersectedObject.userData?.roomId || firstVisibleIntersectedObject.name);
        }

        // Update state
        this.currentlyHoveredObject = firstVisibleIntersectedObject;
      }
    }

    // --- Handle Click (on pointerdown) ---
    if (eventType === "pointerdown" && firstVisibleIntersectedObject) {
      // console.log('Clicked:', firstVisibleIntersectedObject.userData?.roomId || firstVisibleIntersectedObject.name);
      this.dispatchCustomEvent("raycasterclick", {
        object: firstVisibleIntersectedObject,
        originalEvent: originalDomEvent, // Pass the original event if needed
      });
    } else if (eventType === "pointerdown" && !firstVisibleIntersectedObject) {
      // Clicked on empty space (optional event)
      this.dispatchCustomEvent("raycasterclickoff", {
        originalEvent: originalDomEvent,
      });
    }
  }

  /**
   * Helper to dispatch custom events from the canvas element.
   * Other parts of the application can listen for these events.
   * @param {string} eventName - The name of the custom event (e.g., 'raycasterhoverin').
   * @param {object} detail - Data to pass with the event (e.g., { object: intersectedObject }).
   */
  dispatchCustomEvent(eventName, detail) {
    const event = new CustomEvent(eventName, {
      detail: detail,
      bubbles: true, // Allow event to bubble up the DOM tree
      cancelable: true,
    });
    this.domElement.dispatchEvent(event);
  }

  /**
   * Update method, called typically in the animation loop.
   * Currently not essential as logic is event-driven, but can be used
   * for debouncing or time-based effects if needed.
   */
  update() {
    // Example: Could potentially update hover state here if not purely event-driven
  }

  /**
   * Cleans up event listeners. Call this when the handler is no longer needed.
   */
  dispose() {
    this.domElement.removeEventListener("pointermove", this.onPointerMove);
    this.domElement.removeEventListener("pointerdown", this.onPointerDown);

    this.interactiveObjects = [];
    this.currentlyHoveredObject = null;
    console.log("RaycasterHandler disposed.");
  }
}

// Export the class as the default or named export depending on your preference
// Using named export as requested by the error message
export { RaycasterHandler };
