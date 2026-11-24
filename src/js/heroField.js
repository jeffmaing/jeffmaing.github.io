// The portrait as a dot-matrix display: one lit dot per grid cell, brightness from the photo.
// The pointer leaves an afterglow (a decaying heat texture the dots sample), the field tilts
// with a shallow depth from the photo, a boot scan brings it up, and scrolling scatters it.

import * as THREE from 'three';

const POINT_VERT = `
attribute float aBright;
attribute float aDepth;
attribute vec2 aRand;
uniform vec2 uRes;
uniform vec2 uTilt;
uniform float uPitch;
uniform float uDpr;
uniform float uScatter;
uniform float uReveal;
uniform float uBoot;
uniform sampler2D uHeat;
varying float vBright;
varying float vHeat;
varying float vAlpha;
void main() {
  vec2 p = position.xy;
  float order = 0.5 - p.y / uRes.y + aRand.x * 0.025;
  float shown = step(order, uReveal);
  float edge = exp(-abs(uReveal - order) * 26.0) * step(0.002, uReveal) * step(uReveal, 0.998);
  vec2 drift = aRand * vec2(1.0, 1.7) + vec2(0.0, 0.9);
  p += drift * uScatter * uScatter * 130.0;
  vHeat = texture2D(uHeat, p / uRes + 0.5).r;
  p += uTilt * (aDepth - 0.5);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
  gl_PointSize = uPitch * uDpr * (0.30 + 0.60 * aBright + 0.50 * vHeat + 0.70 * edge + 0.28 * uBoot);
  vBright = max(aBright, uBoot * 0.85);
  vAlpha = max(shown, step(0.5, uBoot)) * (1.0 - uScatter);
}
`;

const POINT_FRAG = `
uniform vec3 uColor;
uniform vec3 uAccent;
varying float vBright;
varying float vHeat;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float disc = 1.0 - smoothstep(0.58, 1.0, d);
  if (disc <= 0.004) discard;
  float a = max(0.15 + 0.85 * vBright, vHeat);
  vec3 col = mix(uColor, uAccent, clamp(vHeat * 1.5, 0.0, 1.0));
  float alpha = disc * a * vAlpha;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

const HEAT_VERT = `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const HEAT_FRAG = `
uniform sampler2D uPrev;
uniform vec2 uGrid;
uniform vec2 uA;
uniform vec2 uB;
uniform float uOn;
uniform float uDecay;
varying vec2 vUv;
float segment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}
void main() {
  float h = texture2D(uPrev, vUv).r * uDecay;
  if (uOn > 0.5) {
    float d = segment(vUv * uGrid, uA * uGrid, uB * uGrid);
    h = max(h, smoothstep(9.0, 2.0, d));
  }
  gl_FragColor = vec4(h, 0.0, 0.0, 1.0);
}
`;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Seeded scatter offsets: purely visual, and the same on every load so the field looks identical each visit.
function scatterNoise(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

/**
 * @param {HTMLCanvasElement} canvas
 */
export function createHeroField(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
  });
  renderer.setClearColor(0x000000, 0);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  const dummy = new THREE.Camera();

  // afterglow: a small texture that is decayed and re-splatted every frame (ping-pong)
  let front = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: false, stencilBuffer: false });
  let back = front.clone();
  const heat = new THREE.ShaderMaterial({
    vertexShader: HEAT_VERT,
    fragmentShader: HEAT_FRAG,
    uniforms: {
      uPrev: { value: front.texture },
      uGrid: { value: new THREE.Vector2(1, 1) },
      uA: { value: new THREE.Vector2() },
      uB: { value: new THREE.Vector2() },
      uOn: { value: 0 },
      uDecay: { value: 0.9 },
    },
    depthTest: false,
    depthWrite: false,
  });
  const heatScene = new THREE.Scene();
  const heatGeometry = new THREE.BufferGeometry();
  heatGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  heatScene.add(new THREE.Mesh(heatGeometry, heat));

  const uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTilt: { value: new THREE.Vector2() },
    uPitch: { value: 6 },
    uDpr: { value: dpr },
    uScatter: { value: 0 },
    uReveal: { value: 0 },
    uBoot: { value: 0 },
    uHeat: { value: back.texture },
    uColor: { value: new THREE.Color('#e9eeea') },
    uAccent: { value: new THREE.Color('#f5ae3d') },
  };
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.ShaderMaterial({
    vertexShader: POINT_VERT,
    fragmentShader: POINT_FRAG,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneFactor,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  const state = {
    w: 1,
    h: 1,
    cols: 1,
    rows: 1,
    image: null,
    frames: 2,
    visible: true,
    lost: false,
    pointer: new THREE.Vector2(),
    previous: new THREE.Vector2(),
    tiltTarget: new THREE.Vector2(),
  };
  let raf = 0;
  let last = 0;

  renderer.setPixelRatio(dpr);

  function build(image) {
    state.image = image;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    state.w = w;
    state.h = h;
    renderer.setSize(w, h, false);
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
    uniforms.uRes.value.set(w, h);

    // the plane is a little larger than the window so the tilt never shows an empty corner
    const over = 1.08;
    const W = w * over;
    const H = h * over;
    const pitch = clamp(w / 84, 4.6, 6.6);
    const cols = Math.ceil(W / pitch);
    const rows = Math.ceil(H / pitch);
    state.cols = cols;
    state.rows = rows;
    uniforms.uPitch.value = pitch;

    front.dispose();
    back.dispose();
    front = new THREE.WebGLRenderTarget(cols, rows, { depthBuffer: false, stencilBuffer: false });
    back = front.clone();
    for (const target of [front, back]) {
      renderer.setRenderTarget(target);
      renderer.clear(true, false, false);
    }
    renderer.setRenderTarget(null);
    heat.uniforms.uPrev.value = front.texture;
    heat.uniforms.uGrid.value.set(cols, rows);
    uniforms.uHeat.value = back.texture;

    const scale = Math.min(w / image.width, h / image.height) * 0.985;
    const iw = image.width * scale;
    const ih = image.height * scale;
    const sampler = document.createElement('canvas');
    sampler.width = image.width;
    sampler.height = image.height;
    const context = sampler.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, image.width, image.height).data;
    const iwPx = image.width;

    const count = cols * rows;
    const position = new Float32Array(count * 3);
    const bright = new Float32Array(count);
    const depth = new Float32Array(count);
    const rand = new Float32Array(count * 2);
    const offsets = [-1.3, 1.3];
    const noise = scatterNoise(2011);
    let n = 0;

    for (let j = 0; j < rows; j += 1) {
      for (let i = 0; i < cols; i += 1) {
        const x = (i + 0.5) * pitch - W / 2;
        const y = H / 2 - (j + 0.5) * pitch;
        const ix = (x + iw / 2) / scale;
        const iy = (ih / 2 - y) / scale;
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 0;
        for (const dy of offsets) {
          for (const dx of offsets) {
            const px = clamp(Math.round(ix + dx), 0, image.width - 1);
            const py = clamp(Math.round(iy + dy), 0, image.height - 1);
            const o = (py * iwPx + px) * 4;
            const alpha = data[o + 3] / 255;
            r += data[o] * alpha;
            g += data[o + 1] * alpha;
            b += data[o + 2] * alpha;
            a += alpha;
          }
        }
        if (a < 1.8) continue; // four samples, so below 0.45 average alpha is background
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / (a * 255);
        const value = Math.pow(clamp((luminance - 0.04) / 0.82, 0, 1), 1.05) * (a / 4);

        position[n * 3] = x;
        position[n * 3 + 1] = y;
        bright[n] = value;
        depth[n] = value;
        rand[n * 2] = noise();
        rand[n * 2 + 1] = noise();
        n += 1;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(position.subarray(0, n * 3), 3));
    geometry.setAttribute('aBright', new THREE.BufferAttribute(bright.subarray(0, n), 1));
    geometry.setAttribute('aDepth', new THREE.BufferAttribute(depth.subarray(0, n), 1));
    geometry.setAttribute('aRand', new THREE.BufferAttribute(rand.subarray(0, n * 2), 2));
    state.frames = 2;
  }

  function step(now) {
    const dt = clamp((now - last) / 16.667, 0.25, 3);
    last = now;

    heat.uniforms.uPrev.value = front.texture;
    heat.uniforms.uDecay.value = Math.pow(0.93, dt);
    heat.uniforms.uA.value.copy(state.previous);
    heat.uniforms.uB.value.copy(state.pointer);
    renderer.setRenderTarget(back);
    renderer.render(heatScene, dummy);
    renderer.setRenderTarget(null);
    uniforms.uHeat.value = back.texture;
    [front, back] = [back, front];

    uniforms.uTilt.value.lerp(state.tiltTarget, 1 - Math.pow(1 - 0.09, dt));
    renderer.render(scene, camera);
    state.previous.copy(state.pointer);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (state.lost || !state.visible || document.hidden || state.frames <= 0) return;
    step(now);
    state.frames -= 1;
  }

  /** Ask for at least `n` more rendered frames. */
  function kick(frames = 2) {
    state.frames = Math.max(state.frames, frames);
  }

  function resize() {
    if (!state.image) return;
    const rect = canvas.getBoundingClientRect();
    if (Math.abs(rect.width - state.w) < 1 && Math.abs(rect.height - state.h) < 1) return;
    build(state.image);
    kick();
  }

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    state.lost = true;
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      state.visible = entries[0].isIntersecting;
      last = performance.now();
      kick();
    }).observe(canvas);
  }

  raf = requestAnimationFrame(loop);

  return {
    uniforms,
    build,
    kick,
    resize,

    /** @param {number} x CSS pixels from the left, @param {number} y CSS pixels from the top */
    setPointer(x, y, active) {
      heat.uniforms.uOn.value = active ? 1 : 0;
      // the dots sample the heat texture at (position / size + 0.5), which runs 0..1 across the canvas
      state.pointer.set(x / state.w, 1 - y / state.h);
      if (!active) state.previous.copy(state.pointer);
      state.tiltTarget.set((x / state.w - 0.5) * 30, (0.5 - y / state.h) * 20);
      kick(150);
    },

    release() {
      heat.uniforms.uOn.value = 0;
      state.tiltTarget.set(0, 0);
      kick(60);
    },

    dispose() {
      cancelAnimationFrame(raf);
      geometry.dispose();
      heatGeometry.dispose();
      material.dispose();
      heat.dispose();
      front.dispose();
      back.dispose();
      renderer.dispose();
    },
  };
}
