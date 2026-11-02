// Procedural scorpion geometry, independently testable without a browser or GPU.
import * as THREE from 'three';
export function createScorpion(scene) {
  const rig = new THREE.Group();
  rig.rotation.y = -0.32;
  scene.add(rig);
  const shell = new THREE.MeshStandardMaterial({
    color: 0x27352a,
    metalness: 0.55,
    roughness: 0.29
  });
  const ridge = new THREE.MeshStandardMaterial({ color: 0x97a59b, metalness: 0.7, roughness: 0.3 });
  const joint = new THREE.MeshStandardMaterial({
    color: 0x0b100e,
    metalness: 0.2,
    roughness: 0.55
  });
  const glow = new THREE.MeshBasicMaterial({ color: 0xb3ff5c });
  const floorMat = new THREE.MeshBasicMaterial({
    color: 0xb3ff5c,
    transparent: true,
    opacity: 0.16,
    depthWrite: false
  });
  const geos = {
    sphere: new THREE.SphereGeometry(1, 16, 10),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 10),
    cone: new THREE.ConeGeometry(1, 1, 10),
    torus: new THREE.TorusGeometry(1, 0.012, 5, 80)
  };
  function ellipsoid(parent, pos, scale, mat = shell) {
    const m = new THREE.Mesh(geos.sphere, mat);
    m.position.set(...pos);
    m.scale.set(...scale);
    parent.add(m);
    return m;
  }
  const Y = new THREE.Vector3(0, 1, 0);
  function segment(parent, a, b, r1, r2, mat = shell) {
    const av = new THREE.Vector3(...a),
      bv = new THREE.Vector3(...b),
      delta = bv.clone().sub(av);
    const geom = r2 === r1 ? geos.cylinder : new THREE.CylinderGeometry(r2, r1, 1, 10);
    const m = new THREE.Mesh(geom, mat);
    m.position.copy(av.add(bv).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(Y, delta.clone().normalize());
    m.scale.set(r2 === r1 ? r1 : 1, delta.length(), r2 === r1 ? r1 : 1);
    parent.add(m);
    return m;
  }
  function curve(parent, points, radius, mat) {
    const c = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const m = new THREE.Mesh(new THREE.TubeGeometry(c, 20, radius, 7, false), mat);
    parent.add(m);
    return m;
  }
  // Dorsal armor, narrow head, eight walking legs, two pedipalps and five tail joints.
  ellipsoid(rig, [0, 0.39, -0.25], [0.49, 0.24, 0.85], joint);
  const armor = [];
  for (let i = 0; i < 7; i++) {
    const z = 0.4 - i * 0.23,
      width = 0.46 - Math.abs(i - 2) * 0.025;
    armor.push(ellipsoid(rig, [0, 0.49, z], [width, 0.22, 0.17]));
    curve(
      rig,
      [
        [-width * 0.8, 0.57, z + 0.08],
        [0, 0.71, z + 0.1],
        [width * 0.8, 0.57, z + 0.08]
      ],
      0.009,
      i % 2 === 0 ? glow : ridge
    );
  }
  const head = new THREE.Group();
  head.position.set(0, 0.48, 0.79);
  rig.add(head);
  ellipsoid(head, [0, 0, 0], [0.35, 0.19, 0.35]);
  ellipsoid(head, [0, 0.14, 0.1], [0.19, 0.065, 0.15], ridge);
  for (const side of [-1, 1]) {
    ellipsoid(head, [side * 0.09, 0.18, 0.21], [0.035, 0.026, 0.035], glow);
    segment(head, [side * 0.09, -0.02, 0.25], [side * 0.14, -0.1, 0.51], 0.055, 0.015, joint);
  }
  const legs = [];
  for (const side of [-1, 1])
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      g.position.set(side * 0.36, 0.38, 0.45 - i * 0.35);
      rig.add(g);
      const spread = (1.5 - i) * 0.22;
      const a = [0, 0, 0],
        b = [side * 0.47, 0.17, spread],
        c = [side * 0.92, -0.05, spread + 0.2],
        d = [side * 1.15, -0.36, spread + 0.31];
      segment(g, a, b, 0.078, 0.058);
      ellipsoid(g, b, [0.085, 0.085, 0.085], joint);
      segment(g, b, c, 0.057, 0.035);
      segment(g, c, d, 0.034, 0.008, ridge);
      ellipsoid(g, [side * 0.25, 0.1, spread * 0.5], [0.03, 0.025, 0.03], glow);
      legs.push({ g, side, i });
    }
  const claws = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.25, 0.42, 0.85);
    rig.add(arm);
    segment(arm, [0, 0, 0], [side * 0.52, 0.04, 0.42], 0.105, 0.082);
    ellipsoid(arm, [side * 0.52, 0.04, 0.42], [0.11, 0.11, 0.11], joint);
    segment(arm, [side * 0.52, 0.04, 0.42], [side * 0.72, 0.13, 0.92], 0.095, 0.14);
    const palm = new THREE.Group();
    palm.position.set(side * 0.72, 0.13, 1.02);
    palm.rotation.y = -side * 0.12;
    arm.add(palm);
    ellipsoid(palm, [0, 0, 0.1], [0.23, 0.19, 0.35]);
    ellipsoid(palm, [0, 0.13, 0.13], [0.12, 0.07, 0.22], ridge);
    const finger = new THREE.Group();
    finger.position.set(side * 0.12, 0, 0.3);
    palm.add(finger);
    curve(
      finger,
      [
        [0, 0, 0],
        [side * 0.12, 0, 0.21],
        [side * 0.08, 0.01, 0.43],
        [-side * 0.04, 0.015, 0.55]
      ],
      0.052,
      shell
    );
    curve(
      palm,
      [
        [-side * 0.13, 0, 0.29],
        [-side * 0.23, 0, 0.48],
        [-side * 0.19, 0.01, 0.68],
        [-side * 0.04, 0.015, 0.85]
      ],
      0.045,
      shell
    );
    curve(
      palm,
      [
        [0, 0.19, -0.08],
        [side * 0.06, 0.2, 0.13],
        [side * 0.02, 0.16, 0.3]
      ],
      0.009,
      glow
    );
    claws.push({ arm, finger, side });
  }
  const tail = new THREE.Group();
  tail.position.set(0, 0.47, -1.03);
  rig.add(tail);
  const tailJoints = [];
  let parent = tail;
  const lengths = [0.4, 0.43, 0.45, 0.42, 0.38];
  const angles = [1.05, 0.38, 0.25, 0.45, 0.55];
  lengths.forEach((length, i) => {
    const g = new THREE.Group();
    g.rotation.x = angles[i];
    parent.add(g);
    segment(g, [0, 0, 0], [0, 0, -length], 0.15 - i * 0.018, 0.135 - i * 0.018);
    ellipsoid(g, [0, 0, -length], [0.13 - i * 0.015, 0.13 - i * 0.015, 0.13 - i * 0.015], joint);
    const ring = new THREE.Mesh(geos.torus, glow);
    ring.scale.setScalar(0.14 - i * 0.017);
    ring.position.z = -length * 0.75;
    g.add(ring);
    tailJoints.push({ g, angle: angles[i] });
    const next = new THREE.Group();
    next.position.z = -length;
    g.add(next);
    parent = next;
  });
  ellipsoid(parent, [0, 0, -0.12], [0.15, 0.16, 0.22]);
  curve(
    parent,
    [
      [0, 0, -0.21],
      [0, 0.1, -0.34],
      [0, 0.29, -0.35],
      [0, 0.42, -0.29]
    ],
    0.038,
    ridge
  );
  const sting = ellipsoid(parent, [0, 0.42, -0.29], [0.019, 0.045, 0.019], glow);
  // Contact shadow and instrument rings ground the model without expensive shadow maps.
  const shadowPixels = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const i = (y * 64 + x) * 4;
      shadowPixels[i] = 8;
      shadowPixels[i + 1] = 12;
      shadowPixels[i + 2] = 11;
      shadowPixels[i + 3] = Math.round(
        Math.max(0, 1 - Math.hypot(x - 31.5, y - 31.5) / 32) ** 2 * 150
      );
    }
  const shadowMap = new THREE.DataTexture(shadowPixels, 64, 64);
  shadowMap.needsUpdate = true;
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.035;
  scene.add(shadow);
  const platform = new THREE.Group();
  scene.add(platform);
  [1.7, 1.95, 2.12].forEach((r, i) => {
    const m = new THREE.Mesh(geos.torus, floorMat);
    m.rotation.x = Math.PI / 2;
    m.scale.setScalar(r);
    m.position.y = -0.025 - i * 0.006;
    platform.add(m);
  });
  const ambient = new THREE.HemisphereLight(0xedf2ec, 0x27352a, 2.7);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xedf2ec, 4.5);
  key.position.set(-3, 7, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xb3ff5c, 3);
  rim.position.set(3, 2, -4);
  scene.add(rim);
  const front = new THREE.DirectionalLight(0xedf2ec, 1.4);
  front.position.set(0, 1, 6);
  scene.add(front);
  return {
    rig,
    shell,
    ridge,
    joint,
    glow,
    floorMat,
    head,
    legs,
    claws,
    tail,
    tailJoints,
    sting,
    shadowMap,
    ambient,
    key,
    rim,
    front
  };
}
