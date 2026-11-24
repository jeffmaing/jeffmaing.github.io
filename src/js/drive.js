// "Four gear changes": the career as a drive through time.
// Desktop pins the section and pans the panels horizontally while a marker travels a true time axis.
// Tablets, phones and reduced motion get the same content as a plain vertical list.

import gsap from 'gsap';
import { ScrollTrigger, registerPin } from './scroll.js';
import { prefersReduced } from './env.js';
import { knock } from './motion.js';

const RAIL_START = 2011;
const RAIL_END = 2027;
const WIDE = '(min-width: 1024px) and (min-height: 640px)';

export function initDrive(cluster) {
  const section = document.getElementById('drive');
  const track = document.getElementById('drive-track');
  const marker = document.getElementById('rail-marker');
  const dateLabel = document.getElementById('rail-date');
  const panels = [...track.querySelectorAll('.gear-panel')];
  const spans = panels.map((panel) => [Number(panel.dataset.from), Number(panel.dataset.to)]);
  const wide = window.matchMedia(WIDE);
  let current = -1;
  let tween = null;
  let flow = [];

  const shift = (index, direction) => {
    if (index === current) return;
    const forward = direction ?? (index > current ? 1 : -1);
    current = index;
    knock(panels[index].querySelector('.gear-no'), forward);
  };

  const pinned = () => {
    section.classList.add('is-pinned');
    const rightPad = () => parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const distance = () => {
      const last = panels[panels.length - 1];
      return Math.max(0, last.offsetLeft + last.offsetWidth + rightPad() - window.innerWidth);
    };

    tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${Math.round(distance() * 1.15)}`,
        pin: true,
        // pins add height to the page, so they must be measured before everything below them
        refreshPriority: 1,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const at = self.progress * (panels.length - 1);
          const index = Math.min(panels.length - 1, Math.floor(at));
          const [from, to] = spans[index];
          const date = from + (at - index) * (to - from);
          shift(index, self.direction || 1);
          cluster.setGear(panels[index].dataset.gear);
          cluster.setYear(Math.floor(date));
          marker.style.left = `${((date - RAIL_START) / (RAIL_END - RAIL_START)) * 100}%`;
          const month = Math.min(12, Math.floor((date % 1) * 12) + 1);
          dateLabel.textContent = `${Math.floor(date)}.${String(month).padStart(2, '0')}`;
        },
      },
    });
    registerPin(section, tween.scrollTrigger);
  };

  const stacked = () => {
    section.classList.remove('is-pinned');
    flow = panels.map((panel, index) =>
      ScrollTrigger.create({
        trigger: panel,
        start: 'top 58%',
        end: 'bottom 58%',
        onToggle: (self) => {
          if (!self.isActive) return;
          shift(index, self.direction || 1);
          cluster.setGear(panel.dataset.gear);
          cluster.setYear(panel.dataset.year);
        },
      }),
    );
  };

  const layout = () => {
    if (tween) {
      tween.scrollTrigger?.kill();
      tween.kill();
      tween = null;
      gsap.set(track, { clearProps: 'x' });
    }
    flow.forEach((trigger) => trigger.kill());
    flow = [];
    current = -1;
    if (wide.matches && !prefersReduced()) pinned();
    else stacked();
  };

  layout();
  wide.addEventListener?.('change', () => {
    layout();
    ScrollTrigger.refresh();
  });
}
