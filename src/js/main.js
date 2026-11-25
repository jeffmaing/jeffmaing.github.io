// Entry point: one scroll system, one live cluster, then each section wires itself to it.
import { initTheme } from './theme.js';
import { initScroll, ScrollTrigger, gsap } from './scroll.js';
import { Cluster } from './cluster.js';
import { initOdometers } from './odometer.js';
import { initUI } from './ui.js';
import { initHero } from './hero.js';
import { initThread } from './thread.js';
import { initDrive } from './drive.js';
import { initWork } from './work.js';
import { initMethod } from './method.js';
import { initAbout } from './about.js';
import { splitReveal, fadeUp } from './motion.js';

function start() {
  initTheme();
  const scroll = initScroll();

  // the large hero instrument and the compact one in the navigation bar share one state
  const heroCluster = document.getElementById('cluster');
  const navCluster = document.getElementById('nav-cluster');
  // the navigation copy is a clone of the hero instrument's own (static) markup
  if (heroCluster && navCluster) navCluster.append(...[...heroCluster.childNodes].map((node) => node.cloneNode(true)));
  const cluster = new Cluster([heroCluster, navCluster], document.getElementById('nav-gear'));
  cluster.start();

  // Leaving the hero: the large instrument hands over to the compact one in the navigation bar.
  const hero = document.getElementById('top');
  const measureDock = () => cluster.measureDockLine(hero);
  ScrollTrigger.create({ trigger: hero, start: 'bottom 50%', end: 'max', onRefresh: measureDock });

  // Outside the drive the gearbox sits in neutral, and it parks at the end of the page.
  const idle = { gear: 'N', year: 2026, at: '30%' };
  const enter = { gear: 'P', year: 2026, at: '45%' };
  [
    ['#top', idle],
    ['#thread', idle],
    ['#about', idle],
    ['#contact', enter],
  ].forEach(([selector, state]) => {
    ScrollTrigger.create({
      trigger: selector,
      start: `top ${state.at}`,
      end: `bottom ${state.at}`,
      onToggle: (self) => {
        if (!self.isActive) return;
        cluster.setGear(state.gear);
        cluster.setYear(state.year);
      },
    });
  });

  initUI(scroll);
  initOdometers(ScrollTrigger);
  splitReveal('#drive h2, #work h2');
  fadeUp('.drive-head p, .work-head p, .sheet-body > p');
  initHero(cluster);
  initThread();
  initDrive(cluster);
  initWork(cluster);
  initMethod(cluster, scroll);
  initAbout();

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

  // Debug builds only (the build inlines the flag and removes this branch from the published bundle).
  if (typeof __MM_DEBUG__ !== 'undefined' && __MM_DEBUG__) {
    window.__mm = { gsap, ScrollTrigger };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
