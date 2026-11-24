// Environment facts read once, plus the two that can change while the page is open.
const mq = (query) => (window.matchMedia ? window.matchMedia(query).matches : false);

let webgl = false;
try {
  const probe = document.createElement('canvas');
  webgl = !!(
    window.WebGLRenderingContext &&
    (probe.getContext('webgl2') || probe.getContext('webgl'))
  );
} catch (error) {
  webgl = false;
}

export const env = {
  webgl,
  finePointer: mq('(hover: hover) and (pointer: fine)'),
};

export const prefersReduced = () => mq('(prefers-reduced-motion: reduce)');
export const isDesktop = () => mq('(min-width: 1024px)');

/** Read a CSS custom property as written, so canvas drawing can use the same palette. */
export function token(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Linear promise-based image decode that still resolves when decode() is missing. */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image failed: ${src}`));
    img.src = src;
  });
}
