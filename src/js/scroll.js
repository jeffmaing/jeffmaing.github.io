// One scroll system for the whole page: Lenis feeds GSAP's ScrollTrigger.
// Reduced motion keeps the browser's own scrolling.

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { prefersReduced } from './env.js';

gsap.registerPlugin(ScrollTrigger);

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

  // a link is lit while its section crosses a line a little above the middle of the window
  const links = [...document.querySelectorAll('.nav-link[href^="#"]')];
  links.forEach((link) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    const line = () => window.innerHeight * 0.45;
    ScrollTrigger.create({
      trigger: target,
      start: () => target.getBoundingClientRect().top + window.scrollY - line(),
      end: () => target.getBoundingClientRect().bottom + window.scrollY - line(),
      onToggle: (self) => link.classList.toggle('is-active', self.isActive),
    });
  });

  return {
    /** Glide to a section, accounting for the fixed navigation bar. */
    to(target, offset = 0) {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (!el) return;
      if (lenis) {
        lenis.scrollTo(el, { offset, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
      } else {
        const top = el.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
      }
    },
  };
}

export { gsap, ScrollTrigger };
