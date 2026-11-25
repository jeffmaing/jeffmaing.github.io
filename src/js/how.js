// "How I work": three steps. A step shows its own card only when it is touched; nothing changes by itself.
import { prefersReduced } from './env.js';

const STACKED = '(max-width: 1023px)';

export function initHow(scroll) {
  const steps = [...document.querySelectorAll('.how-steps .step')];
  const cards = [...document.querySelectorAll('.how-card')];
  const panel = document.getElementById('how-panel');
  if (!steps.length || !cards.length || !panel) return;

  const reduce = prefersReduced();

  const show = (index) => {
    steps.forEach((step, k) => {
      step.classList.toggle('is-active', k === index);
      step.setAttribute('aria-pressed', String(k === index));
    });
    cards.forEach((card, k) => card.classList.remove('is-in'));
    cards.forEach((card, k) => {
      card.hidden = k !== index;
    });
    if (!reduce) {
      // the entrance plays again for a card that comes back, so the frame is forced between the two
      void cards[index].offsetWidth;
      cards[index].classList.add('is-in');
    }
  };

  steps.forEach((step, index) =>
    step.addEventListener('click', () => {
      show(index);
      // stacked layouts keep the panel below the tabs: bring it back when the tap left it out of sight
      if (window.matchMedia(STACKED).matches) {
        const top = panel.getBoundingClientRect().top;
        const bar = document.getElementById('nav')?.offsetHeight ?? 0;
        if (top < bar || top > window.innerHeight * 0.6) scroll?.to(panel, -(bar + 12));
      }
    }),
  );

  show(0);
}
