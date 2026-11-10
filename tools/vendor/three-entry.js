// Everything the game uses from three.js, bundled by tools/vendor.mjs into one
// minified offline module (src/vendor/three.js). Re-run after a three.js update.
export * from 'three';
export { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
export { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
export { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
