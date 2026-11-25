// "Four gear changes": the career as a drive through time, told at résumé level.
// Desktop pins the section and pans the phase panels horizontally while a marker travels a true
// time axis; letting go settles the nearest panel against the left edge.
// Tablets, phones and reduced motion get the same content as a plain vertical list.

import gsap from 'gsap';
import { ScrollTrigger, registerPin } from './scroll.js';
import { prefersReduced } from './env.js';
import { knock } from './motion.js';

const RAIL_START = 2007;
const RAIL_END = 2027;
const WIDE = '(min-width: 1024px) and (min-height: 720px)';

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
    const sidePad = () => parseFloat(getComputedStyle(track).paddingLeft) || 0;
    // How far the track must travel, and how far it has moved when each panel's left edge
    // reaches the page margin. Panels differ in width, so positions come from the layout.
    const geometry = () => {
      const pad = sidePad();
      const last = panels[panels.length - 1];
      const distance = Math.max(1, last.offsetLeft + last.offsetWidth + pad - window.innerWidth);
      return { distance, edges: panels.map((panel) => panel.offsetLeft - pad) };
    };
    const snapPoints = () => {
      const { distance, edges } = geometry();
      return edges.map((edge) => Math.min(1, edge / distance));
    };

    tween = gsap.to(track, {
      x: () => -geometry().distance,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${Math.round(geometry().distance * 1.15)}`,
        pin: true,
        // pins add height to the page, so they must be measured before everything below them
        refreshPriority: 1,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        // letting go settles the nearest panel against the page margin
        snap: {
          snapTo: (value) => snapPoints().reduce((nearest, point) => (Math.abs(point - value) < Math.abs(nearest - value) ? point : nearest), 0),
          duration: { min: 0.2, max: 0.6 },
          delay: 0.08,
          ease: 'power2.out',
        },
        onUpdate: (self) => {
          const { distance, edges } = geometry();
          const moved = self.progress * distance;
          // the phase on screen is the panel whose margin-aligned position is closest
          let index = 0;
          edges.forEach((edge, k) => {
            if (Math.abs(edge - moved) < Math.abs(edges[index] - moved)) index = k;
          });
          // time runs across the stretch of track that belongs to that phase
          const lower = index === 0 ? 0 : (edges[index - 1] + edges[index]) / 2;
          const upper = edges[index + 1] === undefined ? Math.max(distance, edges[index] + 1) : (edges[index] + edges[index + 1]) / 2;
          const [from, to] = spans[index];
          const date = from + Math.min(1, Math.max(0, (moved - lower) / (upper - lower))) * (to - from);
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
