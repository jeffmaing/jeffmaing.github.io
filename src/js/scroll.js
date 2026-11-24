// One scroll system for the whole page: Lenis feeds GSAP's ScrollTrigger.
// Reduced motion and touch devices keep the browser's own scrolling.

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { prefersReduced } from './env.js';

gsap.registerPlugin(ScrollTrigger);

/** Pinned sections, keyed by section element. Their start/end already include the pin distance. */
const pins = new Map();
export const registerPin = (section, trigger) => pins.set(section, trigger);

export function initScroll() {
  const reduce = prefersReduced();
  let lenis = null;

  if (!reduce) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const nav = document.getElementById('nav');
  ScrollTrigger.create({
    start: 24,
    end: 'max',
    onToggle: (self) => nav.classList.toggle('is-scrolled', self.isActive),
  });

  const links = [...document.querySelectorAll('.nav-link[href^="#"]')];
  links.forEach((link) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    const line = () => window.innerHeight * 0.45;
    // a pinned section stays on screen for its whole pin distance, so follow the pin's own range
    ScrollTrigger.create({
      trigger: target,
      start: () => pins.get(target)?.start ?? target.getBoundingClientRect().top + window.scrollY - line(),
      end: () => pins.get(target)?.end ?? target.getBoundingClientRect().bottom + window.scrollY - line(),
      onToggle: (self) => link.classList.toggle('is-active', self.isActive),
    });
  });

  return {
    /** Jump to a section, accounting for the fixed navigation bar. */
    to(target, offset = 0) {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (!el) return;
      if (lenis) {
        lenis.scrollTo(el, { offset, duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
      } else {
        const top = el.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
      }
    },
  };
}

export { gsap, ScrollTrigger };
