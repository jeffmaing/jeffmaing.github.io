// Entry point: one scroll system, then each section wires itself to it.
import { initTheme } from './theme.js';
import { initScroll, ScrollTrigger } from './scroll.js';
import { initOdometers } from './odometer.js';
import { initUI } from './ui.js';
import { initHero } from './hero.js';
import { initWork } from './work.js';
import { initWho } from './who.js';
import { initHow } from './how.js';
import { initAsk } from './ask.js';
import { splitReveal, fadeUp } from './motion.js';

function start() {
  initTheme();
  const scroll = initScroll();

  initUI(scroll);
  initOdometers(ScrollTrigger);
  splitReveal('#who h2, #how h2, #work h2, #ideas h2, #ask h2, #career h2, #contact h2');
  fadeUp('.sec-lead, .who-copy > p, .ai-split, .how-quote, .idea-list li, .ask-chips, .ask-panel, .career-list li, .career-facts, .contact-sub, .contact-cta, .contact-line');
  initHero();
  initWork();
  initWho();
  initHow(scroll);
  initAsk(scroll);

  // Webfonts change line heights, so every position is measured again once they are really in.
  // fonts.ready can resolve before a lazily used face has even started loading, so each face is
  // requested explicitly; the window's own load event is the last word.
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener('load', refresh, { once: true });
  if (document.fonts?.load) {
    const faces = ['300 1em "Noto SC"', '400 1em "Noto SC"', '500 1em "Noto SC"', '700 1em "Noto SC"', '400 1em "DIN"', '700 1em "DIN"', '700 1em "DIN Cond"', '400 1em "DIN Exp"'];
    Promise.all(faces.map((face) => document.fonts.load(face).catch(() => null)))
      .then(refresh)
      .then(() => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 400))))
      .then(refresh);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
