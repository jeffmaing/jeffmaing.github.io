// The method stage: one set of dots, four formations. The same dots are the dealership field,
// the written standard, the tool and the intelligent network, so a gear change is visible as a
// re-organisation rather than a new picture.

import * as THREE from 'three';

const VERT = `
attribute vec3 aF2;
attribute vec3 aF3;
attribute vec3 aF4;
attribute vec4 aB;
attribute float aRand;
attribute float aT;
attribute float aSeed;
uniform float uState;
uniform float uTime;
uniform float uScale;
uniform float uSize;
varying float vB;
varying float vPulse;
float easeOut(float t) { return 1.0 - pow(1.0 - t, 3.0); }
void main() {
  float r = (aRand * 0.5 + 0.5) * 0.35;
  float t2 = clamp((uState - 0.0 - r) / 0.65, 0.0, 1.0);
  float t3 = clamp((uState - 1.0 - r) / 0.65, 0.0, 1.0);
  float t4 = clamp((uState - 2.0 - r) / 0.65, 0.0, 1.0);
  float e2 = easeOut(t2);
  float e3 = easeOut(t3);
  float e4 = easeOut(t4);

  vec2 p = position.xy;
  p = mix(p, aF2.xy, e2);
  p = mix(p, aF3.xy, e3);
  p = mix(p, aF4.xy, e4);
  float b = aB.x;
  b = mix(b, aB.y, e2);
  b = mix(b, aB.z, e3);
  b = mix(b, aB.w, e4);

  float moving = (t2 * (1.0 - t2) + t3 * (1.0 - t3) + t4 * (1.0 - t4)) * 4.0;
  p += vec2(aRand, -aRand) * moving * 10.0;

  // in the network, pulses travel along each edge from the left layer to the right
  float wave = fract(uTime * 0.18 + aSeed);
  float isEdge = step(0.05, b) * (1.0 - step(0.8, b));
  vPulse = smoothstep(0.09, 0.0, abs(wave - aT)) * e4 * isEdge;
  vB = b;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p * uScale, 0.0, 1.0);
  gl_PointSize = uSize * (0.34 + 0.66 * b + 0.5 * vPulse);
}
`;

const FRAG = `
uniform vec3 uColor;
uniform vec3 uAccent;
varying float vB;
varying float vPulse;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float disc = 1.0 - smoothstep(0.6, 1.0, d);
  if (disc <= 0.004) discard;
  vec3 col = mix(uColor, uAccent, clamp((vB - 0.7) * 2.0 + vPulse, 0.0, 1.0));
  float alpha = disc * (0.12 + 0.88 * vB + vPulse * 0.8);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Deterministic scatter offsets: purely visual, identical on every load.
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

/** Four target formations for `count` dots, in normalised units (-1..1). */
function formations(count) {
  const field = new Float32Array(count * 2);
  const standard = new Float32Array(count * 2);
  const tool = new Float32Array(count * 2);
  const network = new Float32Array(count * 2);
  const bright = new Float32Array(count * 4);
  const along = new Float32Array(count);
  const phase = new Float32Array(count);
  const noise = scatterNoise(2017);
  const side = Math.round(Math.sqrt(count));

  // 1. the field: 28 visited sites on a loose lattice, everything else is ground noise
  const lattice = [];
  for (let k = 0; k < 28; k += 1) lattice.push(k);
  for (let k = lattice.length - 1; k > 0; k -= 1) {
    const swap = Math.floor(((noise(k) + 1) / 2) * (k + 1));
    [lattice[k], lattice[swap]] = [lattice[swap], lattice[k]];
  }

  // 3. the tool: a four-stage flow
  const flowNodes = [];
  for (const x of [-0.75, -0.25, 0.25, 0.75]) {
    for (const y of [-0.5, 0, 0.5]) flowNodes.push([x, y]);
  }
  const flowEdges = [];
  for (let stage = 0; stage < 3; stage += 1) {
    for (let row = 0; row < 3; row += 1) {
      const from = stage * 3 + row;
      const next = stage * 3 + 3;
      flowEdges.push([from, next + row]);
      const branch = row === 1 ? (stage % 2 === 0 ? 0 : 2) : 1;
      flowEdges.push([from, next + branch]);
    }
  }

  // 4. the network: four layers, fully connected left to right
  const layers = [-0.8, -0.27, 0.27, 0.8];
  const sizes = [4, 6, 6, 3];
  const netNodes = [];
  const layerStart = [];
  sizes.forEach((size, layer) => {
    layerStart[layer] = netNodes.length;
    for (let k = 0; k < size; k += 1) {
      netNodes.push([layers[layer], size === 1 ? 0 : (k / (size - 1) - 0.5) * 1.5]);
    }
  });
  const netEdges = [];
  for (let layer = 0; layer < 3; layer += 1) {
    for (let a = 0; a < sizes[layer]; a += 1) {
      for (let b = 0; b < sizes[layer + 1]; b += 1) {
        netEdges.push([layerStart[layer] + a, layerStart[layer + 1] + b]);
      }
    }
  }

  const placeOnEdge = (target, nodes, edges, index, offset) => {
    const perEdge = Math.ceil((count - offset) / edges.length);
    const edge = edges[index % edges.length];
    const step = Math.floor(index / edges.length);
    const t = perEdge > 1 ? step / (perEdge - 1) : 0.5;
    const [a, b] = edge;
    target[index * 2] = nodes[a][0] + (nodes[b][0] - nodes[a][0]) * t;
    target[index * 2 + 1] = nodes[a][1] + (nodes[b][1] - nodes[a][1]) * t;
    return { t, edge };
  };

  for (let k = 0; k < count; k += 1) {
    const column = k % side;
    const row = Math.floor(k / side);

    if (k < lattice.length) {
      const site = lattice[k];
      field[k * 2] = -0.8 + (((site % 7) + 0.5) / 7) * 1.6 + noise() * 0.05;
      field[k * 2 + 1] = 0.7 - ((Math.floor(site / 7) + 0.5) / 4) * 1.4 + noise() * 0.06;
      bright[k * 4] = 1;
    } else {
      field[k * 2] = noise() * 0.96;
      field[k * 2 + 1] = noise() * 0.96;
      bright[k * 4] = 0.12;
    }

    // 2. the standard: a strict grid with ruled lines
    standard[k * 2] = (column / (side - 1) - 0.5) * 1.74;
    standard[k * 2 + 1] = (0.5 - row / (side - 1)) * 1.74;
    bright[k * 4 + 1] = row % 5 === 2 ? 0.86 : 0.3;

    if (k < flowNodes.length) {
      tool[k * 2] = flowNodes[k][0];
      tool[k * 2 + 1] = flowNodes[k][1];
      bright[k * 4 + 2] = 1;
    } else {
      placeOnEdge(tool, flowNodes, flowEdges, k, flowNodes.length);
      bright[k * 4 + 2] = 0.26;
    }

    if (k < netNodes.length) {
      network[k * 2] = netNodes[k][0];
      network[k * 2 + 1] = netNodes[k][1];
      bright[k * 4 + 3] = 1;
    } else {
      const { t, edge } = placeOnEdge(network, netNodes, netEdges, k, netNodes.length);
      bright[k * 4 + 3] = 0.2;
      along[k] = t;
      phase[k] = ((edge[0] * 31 + edge[1] * 7) % 19) / 19;
    }
  }

  return { field, standard, tool, network, bright, along, phase };
}

/**
 * @param {HTMLCanvasElement} canvas
 */
export function createMethodField(canvas) {
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
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);

  const uniforms = {
    uState: { value: 0 },
    uTime: { value: 0 },
    uScale: { value: 1 },
    uSize: { value: 8 },
    uColor: { value: new THREE.Color('#e9eeea') },
    uAccent: { value: new THREE.Color('#f5ae3d') },
  };
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
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

  const state = { size: 0, frames: 0, visible: false, lost: false };
  let raf = 0;
  let last = 0;

  function layout() {
    const rect = canvas.getBoundingClientRect();
    const size = Math.max(1, Math.round(rect.width));
    if (size === state.size) return;
    state.size = size;
    renderer.setSize(size, size, false);
    camera.left = -size / 2;
    camera.right = size / 2;
    camera.top = size / 2;
    camera.bottom = -size / 2;
    camera.updateProjectionMatrix();
    uniforms.uScale.value = size / 2;
    uniforms.uSize.value = (size / Math.round(size / 15.5)) * dpr;

    const side = clamp(Math.round(size / 15.5), 22, 40);
    const data = formations(side * side);
    const count = side * side;
    const random = new Float32Array(count);
    const noise = scatterNoise(2024);
    for (let k = 0; k < count; k += 1) random[k] = noise();
    // positions are stored as xyz even though the stage is flat, so every component is a real number
    const flat = (source) => {
      const target = new Float32Array(count * 3);
      for (let k = 0; k < count; k += 1) {
        target[k * 3] = source[k * 2];
        target[k * 3 + 1] = source[k * 2 + 1];
      }
      return target;
    };

    geometry.setAttribute('position', new THREE.BufferAttribute(flat(data.field), 3));
    geometry.setAttribute('aF2', new THREE.BufferAttribute(flat(data.standard), 3));
    geometry.setAttribute('aF3', new THREE.BufferAttribute(flat(data.tool), 3));
    geometry.setAttribute('aF4', new THREE.BufferAttribute(flat(data.network), 3));
    geometry.setAttribute('aB', new THREE.BufferAttribute(data.bright, 4));
    geometry.setAttribute('aRand', new THREE.BufferAttribute(random, 1));
    geometry.setAttribute('aT', new THREE.BufferAttribute(data.along, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(data.phase, 1));
    kick();
  }

  function kick(frames = 3) {
    state.frames = Math.max(state.frames, frames);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (state.lost || !state.visible || document.hidden) return;
    const dt = clamp((now - last) / 1000, 0, 0.1);
    last = now;
    // the network keeps pulsing, so it stays alive; the other formations rest
    if (state.frames <= 0 && uniforms.uState.value < 2.6) return;
    uniforms.uTime.value += dt;
    renderer.render(scene, camera);
    state.frames -= 1;
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
  } else {
    state.visible = true;
  }

  layout();
  raf = requestAnimationFrame(loop);

  return {
    uniforms,
    kick,
    layout,
    dispose() {
      cancelAnimationFrame(raf);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
