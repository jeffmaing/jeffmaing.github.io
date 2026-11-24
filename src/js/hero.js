// First viewport: the entrance, the dot portrait and its pointer behaviour.
import gsap from 'gsap';
import { ScrollTrigger } from './scroll.js';
import { env, prefersReduced, loadImage } from './env.js';
import { createHeroField } from './heroField.js';

export function initHero(cluster) {
  const reduce = prefersReduced();
  const display = document.getElementById('hero-display');
  const canvas = display?.querySelector('.hero-canvas');
  if (!display || !canvas) return;

  if (!reduce) {
    gsap
      .timeline({ defaults: { ease: 'expo.out', duration: 1.3 } })
      .from('.nav', { yPercent: -100, duration: 0.9 }, 0.1)
      .from('.hero-zh', { yPercent: 36, opacity: 0 }, 0.15)
      .from('.hero-en', { yPercent: 36, opacity: 0 }, 0.24)
      .from('.hero-lede', { y: 28, opacity: 0 }, 0.42)
      .from('.hero-sub', { y: 18, opacity: 0 }, 0.56)
      .from('.hero-cta .btn', { y: 14, opacity: 0, stagger: 0.08 }, 0.72)
      .from('#cluster > *', { y: 18, opacity: 0, stagger: 0.04 }, 0.8);
    cluster.sweep(1.1);
  }

  let field = null;
  if (env.webgl) {
    try {
      field = createHeroField(canvas);
    } catch (error) {
      field = null; // no usable context: the photograph simply stays
    }
  }

  // If the context is ever lost, hand the frame back to the photograph.
  canvas.addEventListener('webglcontextlost', () => display.classList.remove('is-live'));

  if (field) {
    loadImage('assets/img/portrait-sample.webp')
      .then((image) => {
        field.build(image);
        const u = field.uniforms;
        display.classList.add('is-live');
        if (reduce) {
          u.uReveal.value = 1;
          field.kick(1);
          return;
        }
        // system check: every dot lights, then the display scans the portrait in
        gsap
          .timeline({ onUpdate: () => field.kick() })
          .to(u.uBoot, { value: 1, duration: 0.14, ease: 'power1.in' }, 0.15)
          .to(u.uBoot, { value: 0, duration: 0.26, ease: 'power1.out' }, '+=0.1')
          .to(u.uReveal, { value: 1, duration: 1.15, ease: 'power2.inOut' }, '-=0.14');
      })
      .catch(() => {
        field?.dispose();
        field = null;
      });
  }

  // the pointer is a lamp dragged across the display: afterglow trail, reticle, shallow tilt
  if (field && !reduce && env.finePointer) {
    const lens = display.querySelector('.lens');
    const lensX = gsap.quickTo(lens, 'x', { duration: 0.45, ease: 'power3' });
    const lensY = gsap.quickTo(lens, 'y', { duration: 0.45, ease: 'power3' });

    display.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') display.classList.add('is-hover');
    });
    display.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      field.setPointer(x, y, true);
      lensX(x);
      lensY(y);
    });
    display.addEventListener('pointerleave', () => {
      display.classList.remove('is-hover');
      field.release();
    });
  }

  // leaving the hero: the display breaks up into drifting dots
  if (field && !reduce) {
    gsap.to(field.uniforms.uScatter, {
      value: 1,
      ease: 'none',
      onUpdate: () => field.kick(),
      scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom 30%', scrub: 0.5 },
    });
  }

  // flipping the cabin switch: the cluster needle sweeps, the display blinks
  window.addEventListener('cabinchange', () => {
    if (reduce) return;
    cluster.sweep(0.08);
    if (field) {
      gsap.fromTo(field.uniforms.uBoot, { value: 0.55 }, { value: 0, duration: 0.5, ease: 'power2.out', onUpdate: () => field.kick() });
    }
  });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => field?.resize(), 180);
  });
}
