// First viewport: the entrance. The portrait is simply the photograph itself.
import gsap from 'gsap';
import { prefersReduced } from './env.js';

export function initHero(cluster) {
  const reduce = prefersReduced();

  if (!reduce) {
    gsap
      .timeline({ defaults: { ease: 'expo.out', duration: 1.3 } })
      .from('.nav', { yPercent: -100, duration: 0.9 }, 0.1)
      .from('.hero-display', { opacity: 0, y: 24, duration: 1.1 }, 0.2)
      .from('.hero-zh', { yPercent: 36, opacity: 0 }, 0.15)
      .from('.hero-en', { yPercent: 36, opacity: 0 }, 0.24)
      .from('.hero-lede', { y: 28, opacity: 0 }, 0.42)
      .from('.hero-sub', { y: 18, opacity: 0 }, 0.56)
      .from('.hero-cta .btn', { y: 14, opacity: 0, stagger: 0.08 }, 0.72)
      .from('#cluster > *', { y: 18, opacity: 0, stagger: 0.04 }, 0.8);
    cluster.sweep(1.1);
  }

  // flipping the cabin switch: the cluster needle sweeps again
  window.addEventListener('cabinchange', () => {
    if (reduce) return;
    cluster.sweep(0.08);
  });
}
