// "How I work" as four gears. Desktop pins the stage and scrolls through the four states;
// smaller screens keep the stage stuck at the top while the steps pass beneath it.
import gsap from 'gsap';
import { ScrollTrigger, registerPin } from './scroll.js';
import { env, prefersReduced, isDesktop } from './env.js';
import { createMethodField } from './methodField.js';
import { splitReveal } from './motion.js';

export function initMethod(cluster) {
  const section = document.getElementById('method');
  const pin = section.querySelector('.method-pin');
  const steps = [...section.querySelectorAll('.step')];
  const canvas = section.querySelector('.method-canvas');
  let field = null;
  let active = 0;

  if (canvas && env.webgl) {
    try {
      field = createMethodField(canvas);
    } catch (error) {
      field = null; // the four steps still read on their own
    }
  }

  const show = (index, notify = true) => {
    if (index !== active) {
      active = index;
      steps.forEach((step, k) => step.classList.toggle('is-active', k === index));
      if (notify) cluster.setGear(String(index + 1));
    }
    if (field) {
      gsap.to(field.uniforms.uState, {
        value: index,
        duration: 0.9,
        ease: 'power3.inOut',
        overwrite: true,
        onUpdate: () => field.kick(),
      });
    }
  };

  steps[0]?.classList.add('is-active');

  // Entering the section: the method belongs to the present, so the clock returns to today
  // and the gearbox drops back to the step in view.
  ScrollTrigger.create({
    trigger: section,
    start: 'top 60%',
    end: 'bottom 32%',
    onToggle: (self) => {
      if (!self.isActive) return;
      cluster.setGear(String(active + 1));
      cluster.setYear(2026);
    },
  });

  if (isDesktop() && !prefersReduced()) {
    // One continuous state across the pin: the dots travel between formations as you scroll.
    const onUpdate = (self) => {
      if (field) gsap.to(field.uniforms.uState, { value: self.progress * 3, duration: 0.5, ease: 'power2.out', overwrite: true, onUpdate: () => field.kick() });
      const index = Math.max(0, Math.min(3, Math.round(self.progress * 3)));
      if (index !== active) {
        active = index;
        steps.forEach((step, k) => step.classList.toggle('is-active', k === index));
        cluster.setGear(String(index + 1));
      }
    };
    const created = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=230%',
      pin: pin,
      // pins add height to the page, so they must be measured before everything below them
      refreshPriority: 1,
      anticipatePin: 1,
      scrub: true,
      onUpdate,
    });
    registerPin(section, created);
  } else {
    // Without the pin, the active step is the last one that has crossed a reference line,
    // which reads the same going up as going down.
    ScrollTrigger.create({
      trigger: section,
      start: 'top 70%',
      end: 'bottom 20%',
      onToggle: (self) => {
        if (self.isActive) cluster.setYear(2026);
      },
      onUpdate: () => {
        const line = window.innerHeight * 0.7;
        let index = 0;
        steps.forEach((step, k) => {
          if (step.getBoundingClientRect().top < line) index = k;
        });
        show(index);
      },
    });
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => field?.layout(), 180);
  });

  splitReveal('#method h2');
}
