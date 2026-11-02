import * as THREE from 'three';
import { createScorpion } from '../src/effects/scorpion-model.js';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const scene = new THREE.Scene(),
  model = createScorpion(scene);
assert.equal(model.legs.length, 8);
assert.equal(model.claws.length, 2);
assert.equal(model.tailJoints.length, 5);
const bounds = new THREE.Box3().setFromObject(model.rig);
assert(bounds.min.y > -0.1, 'Legs or tail go underground');
assert(bounds.max.y > 1, 'Tail must rise above carapace');
scene.updateMatrixWorld(true);
const camera = new THREE.PerspectiveCamera(34, 230 / 210, 0.1, 40);
camera.position.set(3.5, 4.8, 7.8);
camera.lookAt(-0.2, 0.6, 0.35);
camera.updateMatrixWorld();
let meshes = 0,
  triangles = 0;
const verts = [];
scene.traverse((o) => {
  if (!o.isMesh || o.material.map) return;
  meshes++;
  const pos = o.geometry.attributes.position,
    index = o.geometry.index,
    norm = o.geometry.attributes.normal;
  const count = index ? index.count : pos.count;
  triangles += count / 3;
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
  for (let i = 0; i < count; i += 3) {
    const points = [],
      normals = [];
    for (let j = 0; j < 3; j++) {
      const k = index ? index.getX(i + j) : i + j;
      const world = new THREE.Vector3().fromBufferAttribute(pos, k).applyMatrix4(o.matrixWorld);
      const projected = world.clone().project(camera);
      assert(Number.isFinite(projected.x));
      points.push(projected.toArray());
      normals.push(
        new THREE.Vector3()
          .fromBufferAttribute(norm, k)
          .applyMatrix3(normalMatrix)
          .normalize()
          .toArray()
      );
    }
    verts.push({
      p: points,
      n: normals,
      c: o.material.color.toArray(),
      emissive: o.material.isMeshBasicMaterial,
      alpha: o.material.opacity
    });
  }
});
assert(meshes < 150);
assert(triangles < 30000);
console.log(
  JSON.stringify({
    meshes,
    triangles,
    bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
    legs: model.legs.length,
    claws: model.claws.length,
    tailJoints: model.tailJoints.length
  })
);
if (process.argv.includes('--render-data'))
  await writeFile('/tmp/scorpion-mesh.json', JSON.stringify(verts));
