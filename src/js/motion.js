// Shared helpers for the scroll-linked sections.
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { prefersReduced } from './env.js';

gsap.registerPlugin(SplitText);

/** Headings rise out of a line mask as they enter. Chinese has no spaces, so SplitText measures per character. */
export function splitReveal(selector) {
  if (prefersReduced()) return;
  document.querySelectorAll(selector).forEach((element) => {
    try {
      SplitText.create(element, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 115,
            duration: 1.2,
            ease: 'expo.out',
            stagger: 0.09,
            scrollTrigger: { trigger: element, start: 'top 86%', once: true },
          }),
      });
    } catch (error) {
      // a heading that cannot be split simply stays visible
    }
  });
}

/** Fade and rise for blocks of copy. */
export function fadeUp(selector) {
  if (prefersReduced()) return;
  document.querySelectorAll(selector).forEach((element) => {
    gsap.from(element, {
      y: 22,
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: { trigger: element, start: 'top 88%', once: true },
    });
  });
}
