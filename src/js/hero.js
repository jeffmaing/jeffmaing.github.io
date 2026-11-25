// First viewport: his claim rises out of its lines, then the four figures behind it roll into place.
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { prefersReduced } from './env.js';

gsap.registerPlugin(SplitText);

export function initHero() {
  if (prefersReduced()) return;

  const timeline = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.3 } });
  timeline
    .from('.nav', { yPercent: -100, duration: 0.9 }, 0.1)
    .from('.hero-eyebrow', { y: 18, opacity: 0 }, 0.2)
    .from('.hero-lede', { y: 24, opacity: 0 }, 0.6)
    .from('.hero-cta .btn', { y: 14, opacity: 0, stagger: 0.08 }, 0.75)
    .from('.hero-facts li', { y: 18, opacity: 0, stagger: 0.07 }, 0.7);

  // the claim is shown a line at a time; a title that cannot be split simply fades in
  const title = document.querySelector('.hero-title');
  try {
    SplitText.create(title, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, { yPercent: 118, duration: 1.5, ease: 'expo.out', stagger: 0.14, delay: 0.35 }),
    });
  } catch (error) {
    gsap.from(title, { y: 36, opacity: 0, delay: 0.35 });
  }
}
