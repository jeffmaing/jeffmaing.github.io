// Who he is: the photograph is uncovered, drifts a little slower than the page, and the signature is written.
import gsap from 'gsap';
import { prefersReduced, isDesktop } from './env.js';

export function initWho() {
  const reduce = prefersReduced();
  const photo = document.querySelector('.who-photo');
  const image = photo?.querySelector('img');
  const signature = document.querySelector('.sig');
  if (reduce) return;

  if (photo && image) {
    gsap.fromTo(
      photo,
      { clipPath: 'inset(0 0 100% 0)' },
      {
        clipPath: 'inset(0 0 0% 0)',
        ease: 'none',
        scrollTrigger: { trigger: photo, start: 'top 88%', end: 'top 30%', scrub: 0.4 },
      },
    );
    // the frame is exactly the photograph's size on narrow screens, so there is nothing to drift there
    if (isDesktop()) {
      gsap.fromTo(
        image,
        { yPercent: 0 },
        { yPercent: -11, ease: 'none', scrollTrigger: { trigger: photo, start: 'top bottom', end: 'bottom top', scrub: true } },
      );
    }
  }

  if (signature) {
    gsap.fromTo(
      signature,
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: 'inset(0 0% 0 0)',
        duration: 1.7,
        ease: 'power2.inOut',
        scrollTrigger: { trigger: signature, start: 'top 92%', once: true },
      },
    );
  }
}
