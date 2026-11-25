// Environment facts read once, plus the one that can change while the page is open.
const mq = (query) => (window.matchMedia ? window.matchMedia(query).matches : false);

export const env = {
  finePointer: mq('(hover: hover) and (pointer: fine)'),
};

export const prefersReduced = () => mq('(prefers-reduced-motion: reduce)');
export const isDesktop = () => mq('(min-width: 1024px)');

/** Read a CSS custom property as written, so canvas drawing can use the same palette. */
export function token(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
