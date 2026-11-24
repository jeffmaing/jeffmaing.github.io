// About and contact: the second photograph, the handwritten signature, and the close of the drive.
import gsap from 'gsap';
import { ScrollTrigger } from './scroll.js';
import { prefersReduced, isDesktop } from './env.js';
import { splitReveal, fadeUp } from './motion.js';

export function initAbout() {
  const reduce = prefersReduced();
  const photo = document.querySelector('.about-photo');
  const image = photo?.querySelector('img');
  const signature = document.querySelector('.sig');

  if (!reduce) {
    // the photograph is uncovered top to bottom, and drifts a little slower than the page
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
    // the signature is written left to right
    if (signature) {
      gsap.fromTo(
        signature,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: 1.7,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: signature, start: 'top 90%', once: true },
        },
      );
    }
  }

  splitReveal('#about h2, #contact h2');
  fadeUp('.about-copy > p, .edu, .brands, .contact-sub, .contact-cta, .contact-line');
}
