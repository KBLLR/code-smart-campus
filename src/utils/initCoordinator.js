// src/utils/initCoordinator.js

const readyPromises = {};
const readyResolvers = {};

/**
 * Creates a promise that resolves when a specific resource is marked as ready.
 * @param {string} resourceName
 * @returns {Promise<any>}
 */
export function whenReady(resourceName) {
  if (!readyPromises[resourceName]) {
    readyPromises[resourceName] = new Promise((resolve) => {
      readyResolvers[resourceName] = resolve;
    });
  }
  return readyPromises[resourceName];
}

/**
 * Marks a resource as ready and resolves its corresponding promise.
 * @param {string} resourceName
 * @param {any} [data=true] - Optional data to resolve the promise with.
 */
export function markReady(resourceName, data = true) {
  if (readyResolvers[resourceName]) {
    readyResolvers[resourceName](data);
  } else {
    // If markReady is called before whenReady, create the promise now
    readyPromises[resourceName] = Promise.resolve(data);
  }
}

/**
 * Creates a simple signal object containing a promise and its resolve/reject functions.
 * Useful for signaling completion of async operations not tied to resource names.
 * @returns {{promise: Promise<void>, resolve: Function, reject: Function}}
 */
export function createSignal() {
  let resolveFn, rejectFn;
  const promise = new Promise((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  return { promise, resolve: resolveFn, reject: rejectFn };
}
