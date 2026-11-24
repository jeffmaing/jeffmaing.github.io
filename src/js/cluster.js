// The live cluster: gear, speed and the year the page is currently telling.
// Scroll is the throttle. The needle follows scroll velocity, gears change with the chapter,
// and the year drum rolls through the timeline.
// One state, two instruments on desktop: the large one in the hero and a compact one the
// navigation bar takes over once the hero is gone (plus a text readout on phones).

import gsap from 'gsap';
import { Odometer } from './odometer.js';

const MAX_SPEED = 200;
const TAU = Math.PI * 2;
const START = (165 * Math.PI) / 180;
const SWEEP = (210 * Math.PI) / 180;
const FACE = { ink: '#efeae0', dim: 'rgba(239,234,224,0.42)', faint: 'rgba(239,234,224,0.18)', lamp: '#f5ae3d', face: '#04131b' };

// Drawn in a fixed 108 x 56 space and scaled to whatever size the instrument has.
function drawSpeedo(ctx, ratio, w, h, value, compact) {
  const scale = Math.min(w / 108, h / 56);
  ctx.setTransform(ratio * scale, 0, 0, ratio * scale, 0, 0);
  ctx.clearRect(0, 0, w / scale, h / scale);
  const cx = 54;
  const cy = 44;
  const R = 40;
  const weight = compact ? 1.8 : 1;
  ctx.lineCap = 'butt';

  ctx.strokeStyle = FACE.faint;
  ctx.lineWidth = weight;
  ctx.beginPath();
  ctx.arc(cx, cy, R, START, START + SWEEP);
  ctx.stroke();

  // the top of the scale is marked in the signal colour, like a redline
  ctx.strokeStyle = 'rgba(245,174,61,0.75)';
  ctx.beginPath();
  ctx.arc(cx, cy, R, START + SWEEP * 0.86, START + SWEEP);
  ctx.stroke();

  for (let v = 0; v <= MAX_SPEED; v += 10) {
    const a = START + (SWEEP * v) / MAX_SPEED;
    const major = v % 40 === 0;
    const inner = R - (major ? 6 : 3);
    ctx.strokeStyle = major ? FACE.dim : FACE.faint;
    ctx.lineWidth = weight;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.stroke();
  }

  if (!compact) {
    ctx.fillStyle = FACE.dim;
    ctx.font = '400 9px DIN, "DIN Alternate", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let v = 0; v <= MAX_SPEED; v += 40) {
      const a = START + (SWEEP * v) / MAX_SPEED;
      ctx.fillText(String(v), cx + Math.cos(a) * (R - 13), cy + Math.sin(a) * (R - 13));
    }
  }

  const a = START + SWEEP * Math.min(Math.max(value / MAX_SPEED, 0), 1);
  ctx.strokeStyle = FACE.lamp;
  ctx.lineWidth = (compact ? 3 : 2) * weight;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - Math.cos(a) * 5, cy - Math.sin(a) * 5);
  ctx.lineTo(cx + Math.cos(a) * (R - 2), cy + Math.sin(a) * (R - 2));
  ctx.stroke();

  ctx.fillStyle = FACE.face;
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = FACE.lamp;
  ctx.lineWidth = 1.5 * weight;
  ctx.stroke();
}

export class Cluster {
  /**
   * @param {HTMLElement[]} roots  instruments that share the state (same inner markup)
   * @param {HTMLElement} mirror   the compact text readout used on phones
   */
  constructor(roots, mirror) {
    this.mirror = mirror;
    this.mirrorLetter = mirror?.querySelector('.nav-gear-d') ?? null;
    this.mirrorNumber = mirror?.querySelector('.nav-gear-n') ?? null;
    this.mirrorOdo = mirror ? new Odometer(mirror.querySelector('#nav-gear-year'), { value: 2026 }) : null;
    this.mirrorOdo?.set(2026, { animate: false });

    this.views = roots.filter(Boolean).map((root) => {
      const canvas = root.querySelector('.speedo');
      const odo = new Odometer(root.querySelector('.cluster-odo'), { value: 2026 });
      odo.set(2026, { animate: false });
      return {
        root,
        letter: root.querySelector('.gear-letter-reel'),
        number: root.querySelector('.gear-num-reel'),
        canvas,
        ctx: canvas.getContext('2d'),
        ratio: 1,
        compact: root.classList.contains('nav-cluster'),
        readout: root.querySelector('.speed-val'),
        odo,
      };
    });

    this.gear = null;
    this.year = null;
    this.speed = 0;
    this.target = 0;
    this.sweeping = 0;
    this.shown = -1;
    this.dirty = true;
    this.lastY = window.scrollY;
    this.shiftTimer = 0;
    this.docked = false;
    this.dockLine = Infinity;
    this.frame = this.frame.bind(this);

    this.resize();
    this.setGear('N', false);
    this.setYear(2026, false);
  }

  resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    for (const view of this.views) {
      const box = getComputedStyle(view.canvas);
      // a display:none instrument still reports its authored size, which is what it will have when shown
      const w = parseFloat(box.width) || 108;
      const h = parseFloat(box.height) || 56;
      view.ratio = ratio;
      view.canvas.width = Math.round(w * ratio);
      view.canvas.height = Math.round(h * ratio);
    }
    this.dirty = true;
  }

  start() {
    gsap.ticker.add(this.frame);
    window.addEventListener('resize', () => this.resize());
  }

  /** Leaving the hero: the large instrument steps aside and the navigation bar carries a compact one. */
  setDocked(docked) {
    this.docked = docked;
    document.getElementById('nav')?.classList.toggle('is-docked', docked);
    this.views.filter((view) => !view.compact).forEach((view) => view.root.classList.toggle('is-docked', docked));
    requestAnimationFrame(() => this.resize());
  }

  /**
   * The scroll position at which the hero counts as gone. Measured from the page rather than
   * toggled by an event, so it holds at the very bottom of the page and after long jumps.
   */
  measureDockLine(hero) {
    this.dockLine = hero.getBoundingClientRect().bottom + window.scrollY - window.innerHeight * 0.5;
  }

  /** Ignition sweep: the needle swings to the top of the scale and settles back. */
  sweep(delay = 0) {
    gsap.fromTo(
      this,
      { sweeping: 0 },
      {
        sweeping: 1,
        duration: 0.6,
        delay,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
        yoyoEase: 'power2.in',
        onUpdate: () => {
          this.dirty = true;
        },
        onComplete: () => {
          this.sweeping = 0;
          this.dirty = true;
        },
      },
    );
  }

  /**
   * @param {'P'|'N'|'1'|'2'|'3'|'4'} gear
   */
  setGear(gear, animate = true) {
    const key = String(gear);
    if (key === this.gear) return;
    this.gear = key;
    const drive = key !== 'P' && key !== 'N';
    const letter = key === 'P' ? 0 : key === 'N' ? 1 : 2;
    const digit = drive ? Number(key) - 1 : 0;

    for (const view of this.views) {
      view.root.classList.toggle('is-drive', drive);
      view.letter.style.transitionDuration = animate ? '' : '0s';
      view.number.style.transitionDuration = animate ? '' : '0s';
      view.letter.style.transform = `translateY(${-letter}em)`;
      view.number.style.transform = `translateY(${-digit}em)`;
      if (animate) {
        view.root.classList.add('is-shift');
        clearTimeout(view.shiftTimer);
        view.shiftTimer = setTimeout(() => view.root.classList.remove('is-shift'), 460);
      }
    }

    this.mirror?.classList.toggle('is-drive', drive);
    if (this.mirrorLetter) this.mirrorLetter.textContent = drive ? 'D' : key;
    if (this.mirrorNumber) this.mirrorNumber.textContent = drive ? key : '';
  }

  setYear(year, animate = true) {
    const value = Number(year);
    if (value === this.year) return;
    this.year = value;
    for (const view of this.views) view.odo.set(value, { animate, duration: 0.7 });
    this.mirrorOdo?.set(value, { animate, duration: 0.7 });
  }

  frame(time, deltaMs) {
    const dt = Math.min(deltaMs, 64) / 1000;
    const y = window.scrollY;
    const travelled = Math.abs(y - this.lastY);
    this.lastY = y;

    if (this.dockLine === Infinity || travelled > 0) {
      const docked = y >= this.dockLine;
      if (docked !== this.docked) this.setDocked(docked);
    }

    const instant = Math.min(MAX_SPEED, (dt > 0 ? travelled / dt : 0) * 0.07);
    if (instant > 2) {
      this.target += (instant - this.target) * 0.35;
    } else {
      this.target *= Math.pow(0.015, dt);
    }
    // a real needle rises quickly and drifts back down
    this.speed += (this.target - this.speed) * (this.target > this.speed ? 0.24 : 0.085);
    if (this.speed < 0.05 && this.target < 0.05) {
      this.speed = 0;
      this.target = 0;
    }

    const shown = Math.round(this.speed);
    const moved = shown !== this.shown;
    // getClientRects is empty when a layout hides every instrument
    if (!(moved || this.dirty) || document.hidden) return;
    if (!this.views.some((view) => view.root.getClientRects().length > 0)) return;

    const value = Math.max(this.speed, this.sweeping * MAX_SPEED);
    for (const view of this.views) {
      const w = view.canvas.width / view.ratio;
      const h = view.canvas.height / view.ratio;
      drawSpeedo(view.ctx, view.ratio, w, h, value, view.compact);
      view.readout.textContent = String(shown);
    }
    this.shown = shown;
    this.dirty = false;
  }
}
