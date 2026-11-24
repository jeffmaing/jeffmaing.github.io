// The through-line of the career: phrases light up in reading order as the visitor scrolls.
import gsap from 'gsap';
import { ScrollTrigger } from './scroll.js';
import { prefersReduced } from './env.js';

export function initThread() {
  const phrases = [...document.querySelectorAll('.thread .ph')];
  if (!phrases.length || prefersReduced()) return;

  gsap.set(phrases, { opacity: 0.16 });
  gsap.to(phrases, {
    opacity: 1,
    stagger: 0.5,
    ease: 'none',
    scrollTrigger: { trigger: '#thread', start: 'top 78%', end: 'bottom 60%', scrub: true },
  });
}
