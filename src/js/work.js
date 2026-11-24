// Dossier sheets: each one sticks, and the next slides over it while it settles back and dims.
import gsap from 'gsap';
import { ScrollTrigger } from './scroll.js';
import { prefersReduced, isDesktop } from './env.js';

export function initWork(cluster) {
  const sheets = [...document.querySelectorAll('.sheet')];

  sheets.forEach((sheet, index) => {
    sheet.style.setProperty('--i', String(index));
    ScrollTrigger.create({
      trigger: sheet,
      start: 'top 60%',
      end: 'bottom 60%',
      onToggle: (self) => {
        if (!self.isActive) return;
        cluster.setGear(sheet.dataset.gear);
        cluster.setYear(sheet.dataset.year);
      },
    });
  });

  if (!isDesktop() || prefersReduced()) return;

  sheets.forEach((sheet, index) => {
    const next = sheets[index + 1];
    if (!next) return;
    const rest = () => parseFloat(getComputedStyle(next).top) || 0;
    gsap.to(sheet, {
      scale: 0.965,
      '--dim': 0.8,
      ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: () => `top ${rest()}px`, scrub: true },
    });
  });
}
