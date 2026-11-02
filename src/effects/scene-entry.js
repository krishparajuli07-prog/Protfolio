// TUNING: a procedural, articulated 3D scorpion. No model downloads, textures or remote requests.
import * as THREE from 'three';
import { createScorpion } from './scorpion-model.js';
const CONFIG = {
  pixelRatio: 1.5,
  mobilePixelRatio: 1,
  maxFPS: 60,
  liteFPS: 30,
  strikeMS: 1150,
  cameraDistance: 7.8
};
window.initBicchuScene = function (api) {
  const { host, frame, full, active, coarse, palette, onImpact } = api;
  let renderer;
  try {
    const surface = document.createElement('canvas');
    const context = surface.getContext('webgl2', {
      alpha: true,
      antialias: !coarse.matches,
      powerPreference: 'low-power'
    });
    if (!context) {
      host.dataset.scene = 'fallback';
      return null;
    }
    renderer = new THREE.WebGLRenderer({
      canvas: surface,
      context,
      alpha: true,
      antialias: !coarse.matches,
      powerPreference: 'low-power'
    });
  } catch {
    host.dataset.scene = 'fallback';
    return null;
  }
  const canvas = renderer.domElement;
  canvas.className = 'scorpion-webgl';
  canvas.setAttribute('aria-hidden', 'true');
  renderer.setPixelRatio(
    Math.min(devicePixelRatio || 1, coarse.matches ? CONFIG.mobilePixelRatio : CONFIG.pixelRatio)
  );
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  host.append(canvas);
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(3.5, 4.8, CONFIG.cameraDistance);
  camera.lookAt(-0.2, 0.6, 0.35);
  const {
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
  } = createScorpion(scene);
  let disposed = false,
    lost = false,
    shown = true,
    stop = () => {},
    last = 0,
    tx = 0,
    ty = 0,
    rx = 0,
    ry = 0,
    strikeStart = -Infinity,
    impacted = false,
    revealStart = performance.now();
  function colors() {
    const p = palette();
    shell.color.set(p.border);
    ridge.color.set(p.muted);
    joint.color.set(p.bg);
    glow.color.set(p.primary);
    floorMat.color.set(p.primary);
    rim.color.set(p.primary);
    ambient.color.set(p.text);
    key.color.set(p.text);
    renderOnce();
  }
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderOnce();
  }
  function renderOnce() {
    if (!disposed && !lost) renderer.render(scene, camera);
  }
  function tick(now, dt) {
    const fps = full() && !coarse.matches ? CONFIG.maxFPS : CONFIG.liteFPS;
    if (now - last < 1000 / fps - 1) return;
    last = now;
    const t = now / 1000,
      ease = 1 - Math.exp(-dt * 0.005),
      live = full() && !coarse.matches;
    rx += (tx - rx) * ease;
    ry += (ty - ry) * ease;
    rig.rotation.y = -0.32 + (live ? rx * 0.5 : 0) + Math.sin(t * 0.22) * 0.055;
    rig.rotation.x = live ? ry * 0.07 : 0;
    rig.position.y = Math.sin(t * 1.3) * 0.012;
    head.rotation.y = live ? rx * 0.13 : 0;
    legs.forEach(({ g, side, i }) => {
      g.rotation.y = Math.sin(t * 1.25 + i * 1.4) * 0.025 * side;
      g.rotation.z = Math.sin(t * 1.25 + i * 1.4) * 0.018;
    });
    const p = (now - strikeStart) / CONFIG.strikeMS;
    const attack = p >= 0 && p < 1 ? Math.sin(Math.PI * Math.min(1, p / 0.62)) : 0;
    tail.rotation.x = attack * 0.9;
    tail.rotation.z = Math.sin(t * 0.7) * 0.04 + (live ? rx * 0.12 : 0);
    tailJoints.forEach(({ g, angle }, i) => {
      g.rotation.x =
        angle + Math.sin(t * 0.75 + i * 0.35) * 0.025 + attack * (i > 1 ? 0.08 : -0.08);
    });
    claws.forEach(({ arm, finger, side }) => {
      arm.rotation.y = side * (Math.sin(t * 0.8) * 0.035 - attack * 0.12);
      finger.rotation.y = side * (0.1 + Math.sin(t * 1.1) * 0.1 + attack * 0.23);
    });
    if (p >= 0.33 && p < 1 && !impacted) {
      impacted = true;
      const at = sting.getWorldPosition(new THREE.Vector3()).project(camera);
      const b = host.getBoundingClientRect();
      onImpact(b.left + (at.x * 0.5 + 0.5) * b.width, b.top + (-at.y * 0.5 + 0.5) * b.height);
    }
    const reveal = Math.min(1, (now - revealStart) / 850);
    rig.scale.setScalar(0.88 + 0.12 * (1 - (1 - reveal) ** 3));
    renderer.render(scene, camera);
  }
  function sync() {
    stop();
    stop = () => {};
    canvas.hidden = !active() || lost;
    host.classList.toggle('scene-ready', active() && !lost);
    if (active() && !lost && shown && !document.hidden) stop = frame(tick);
  }
  function pointer(e) {
    const b = host.getBoundingClientRect();
    tx = Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1));
    ty = Math.max(-1, Math.min(1, ((e.clientY - b.top) / b.height) * 2 - 1));
  }
  function leave() {
    tx = ty = 0;
  }
  function strike() {
    if (!active() || performance.now() - strikeStart < CONFIG.strikeMS) return;
    strikeStart = performance.now();
    impacted = false;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      shown = entries[0].isIntersecting;
      sync();
    },
    { rootMargin: '60px' }
  );
  observer.observe(host);
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(host);
  const themeObserver = new MutationObserver(colors);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
  host.addEventListener('pointermove', pointer);
  host.addEventListener('pointerleave', leave);
  host.addEventListener('click', strike);
  document.addEventListener('fxchange', sync);
  document.addEventListener('visibilitychange', sync);
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
    stop();
    host.classList.remove('scene-ready');
    host.dataset.scene = 'fallback';
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    host.dataset.scene = 'ready';
    resize();
    sync();
  });
  colors();
  resize();
  host.dataset.scene = 'ready';
  sync();
  return {
    strike,
    dispose() {
      disposed = true;
      stop();
      observer.disconnect();
      sizeObserver.disconnect();
      themeObserver.disconnect();
      host.removeEventListener('pointermove', pointer);
      host.removeEventListener('pointerleave', leave);
      host.removeEventListener('click', strike);
      document.removeEventListener('fxchange', sync);
      document.removeEventListener('visibilitychange', sync);
      const geometries = new Set(),
        materials = new Set();
      scene.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        if (o.material) materials.add(o.material);
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      shadowMap.dispose();
      renderer.dispose();
      canvas.remove();
      host.classList.remove('scene-ready');
    }
  };
};
