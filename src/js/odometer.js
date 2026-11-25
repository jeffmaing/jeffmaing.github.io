// Drum odometer: each digit is a reel of 0-9 that rolls to its value.
// The element keeps one invisible in-flow glyph so it sits on the real text baseline.

const REELS = 10;

export class Odometer {
  /**
   * @param {HTMLElement} el
   * @param {{ value: string|number, label?: boolean }} options  label: keep the value for screen readers
   */
  constructor(el, { value = 0, label = false } = {}) {
    this.el = el;
    this.text = String(value);
    this.reels = [];
    el.textContent = '';
    el.classList.add('odo');

    if (label) {
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = this.text;
      el.appendChild(sr);
    }

    for (const ch of this.text) {
      if (/\d/.test(ch)) {
        const digit = document.createElement('span');
        digit.className = 'odo-d';
        digit.setAttribute('aria-hidden', 'true');
        const ghost = document.createElement('span');
        ghost.className = 'odo-ghost';
        ghost.textContent = '0';
        const reel = document.createElement('span');
        reel.className = 'odo-reel';
        for (let n = 0; n < REELS; n += 1) {
          const cell = document.createElement('span');
          cell.textContent = String(n);
          reel.appendChild(cell);
        }
        digit.append(ghost, reel);
        el.appendChild(digit);
        this.reels.push(reel);
      } else {
        const sep = document.createElement('span');
        sep.className = 'odo-s';
        sep.textContent = ch;
        el.appendChild(sep);
        this.reels.push(null);
      }
    }
  }

  /**
   * @param {string|number} value
   * @param {{ animate?: boolean, duration?: number }} options
   */
  set(value, { animate = true, duration = 1.1 } = {}) {
    const text = String(value).padStart(this.reels.length, '0');
    this.reels.forEach((reel, i) => {
      if (!reel) return;
      const digit = Number(text[i]) || 0;
      const move = `translateY(${-digit}em)`;
      if (!animate) {
        reel.style.transition = 'none';
        reel.style.transform = move;
        return;
      }
      // the right-hand drum spins first and finishes first, like a real counter
      const rank = this.reels.length - 1 - i;
      reel.style.transition = `transform ${duration + rank * 0.26}s cubic-bezier(.2,.85,.25,1) ${rank * 0.04}s`;
      reel.style.transform = move;
    });
  }

  /** Reels keep their transform, so a fresh frame is needed before they may animate again. */
  flush() {
    void this.el.offsetWidth;
  }
}

/** Every [data-odo] in the copy starts at its "from" value and rolls once it scrolls into view. */
export function initOdometers(ScrollTrigger) {
  const nodes = [...document.querySelectorAll('[data-odo]')];
  nodes.forEach((el) => {
    const target = el.dataset.odo;
    const from = el.dataset.odoFrom ?? '0';
    const odo = new Odometer(el, { value: target, label: true });
    odo.set(from, { animate: false });
    odo.flush();
    // a figure that is on screen from the start rolls once the entrance has settled
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
      window.setTimeout(() => odo.set(target, { animate: true, duration: 1.4 }), 1100);
      return;
    }
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => odo.set(target, { animate: true, duration: 1.2 }),
    });
  });
}
