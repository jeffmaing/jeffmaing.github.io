// "Four capabilities": click one and the display on the left shows what it meant in real work.
// Each panel lists deliverables the owner actually produced; the active one is spelled out
// underneath, and the list reads itself forward until the visitor takes over.
// On desktop the section is pinned and scrolling walks through the four; a click moves the page
// to the matching point, so scrolling simply carries on from the chosen capability.

import gsap from 'gsap';
import { ScrollTrigger, registerPin } from './scroll.js';
import { prefersReduced, isDesktop } from './env.js';
import { splitReveal } from './motion.js';

const CADENCE = 3200; // how long an item stays lit while the list reads itself
const HOLD = 7000; // how long a hand-picked item is left alone

export function initMethod(cluster, scroll) {
  const section = document.getElementById('method');
  const pin = section.querySelector('.method-pin');
  const stage = section.querySelector('.method-stage');
  const steps = [...section.querySelectorAll('.step')];
  const panels = [...section.querySelectorAll('.cap-panel')];
  if (!steps.length || !panels.length) return;

  const reduce = prefersReduced();
  let active = 0;
  let cursor = 0;
  let timer = 0;
  let follow = true; // false after a click, until the page has arrived at the chosen capability
  let pinRange = null;

  // every item carries its own progress line, which makes the reading order visible
  panels.forEach((panel) => {
    panel.hidden = false;
    panel.querySelectorAll('.cap-item').forEach((item) => {
      item.setAttribute('aria-pressed', 'false');
      const bar = document.createElement('span');
      bar.className = 'bar';
      item.appendChild(bar);
    });
  });

  const stop = () => clearTimeout(timer);

  const showItem = (index, animate) => {
    const panel = panels[active];
    const items = [...panel.querySelectorAll('.cap-item')];
    const at = (index + items.length) % items.length;
    items.forEach((item, k) => {
      item.classList.toggle('is-on', k === at);
      item.setAttribute('aria-pressed', String(k === at));
      const bar = item.querySelector('.bar');
      bar.style.transition = 'none';
      bar.style.transform = 'scaleX(0)';
    });
    panel.querySelector('.cap-detail').textContent = items[at].dataset.detail;
    if (animate) {
      const bar = items[at].querySelector('.bar');
      void bar.offsetWidth;
      bar.style.transition = `transform ${CADENCE}ms linear`;
      bar.style.transform = 'scaleX(1)';
    }
    cursor = at;
  };

  const read = (delay = CADENCE) => {
    stop();
    if (reduce) return;
    timer = setTimeout(() => {
      showItem(cursor + 1, true);
      read();
    }, delay);
  };

  const show = (index, { fromScroll = false, notify = true } = {}) => {
    const changed = index !== active;
    if (!fromScroll) follow = false;
    active = index;
    panels.forEach((panel, k) => panel.classList.toggle('is-on', k === index));
    steps.forEach((step, k) => {
      step.classList.toggle('is-active', k === index);
      step.setAttribute('aria-pressed', String(k === index));
    });
    if (notify) cluster.setGear(String(index + 1));
    showItem(0, !reduce);
    read();
    if (changed && !reduce) {
      gsap.fromTo(
        panels[index].querySelectorAll('.cap-flow span, .cap-item'),
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.035, ease: 'expo.out', overwrite: true, clearProps: 'transform,opacity' },
      );
    }
  };

  steps.forEach((step, index) =>
    step.addEventListener('click', () => {
      show(index);
      if (pinRange) {
        const reach = pinRange.start + ((pinRange.end - pinRange.start) * index) / (steps.length - 1);
        scroll?.toY(reach);
        setTimeout(() => {
          follow = true;
        }, 1400);
      } else {
        // stacked layouts have the switches below the display, so bring the display back when a
        // choice would otherwise happen out of sight
        const box = stage.getBoundingClientRect();
        const bar = document.getElementById('nav')?.offsetHeight ?? 0;
        if (box.top < bar || box.bottom > window.innerHeight) scroll?.to(stage, -(bar + 10));
      }
    }),
  );

  panels.forEach((panel) =>
    panel.addEventListener('click', (event) => {
      const item = event.target.closest('.cap-item');
      if (!item) return;
      showItem([...panel.querySelectorAll('.cap-item')].indexOf(item), false);
      read(HOLD);
    }),
  );

  // resting the pointer on the display pauses the reading; leaving resumes it
  stage.addEventListener('pointerenter', stop);
  stage.addEventListener('pointerleave', () => read());
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => (entries[0].isIntersecting ? read() : stop())).observe(section);
  }

  // Entering the section: the capabilities belong to the present, so the clock returns to today.
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

  if (isDesktop() && !reduce) {
    pinRange = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=230%',
      pin: pin,
      // pins add height to the page, so they must be measured before everything below them
      refreshPriority: 1,
      anticipatePin: 1,
      scrub: true,
      onUpdate: (self) => {
        if (!follow) return;
        const index = Math.max(0, Math.min(steps.length - 1, Math.round(self.progress * (steps.length - 1))));
        if (index !== active) show(index, { fromScroll: true });
      },
    });
    registerPin(section, pinRange);
  }

  show(0, { notify: false });
  follow = true; // the opening state is not a choice; scrolling drives it from the start
  splitReveal('#method h2');
}
