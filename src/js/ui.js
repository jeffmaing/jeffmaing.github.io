// Navigation behaviour, the mobile menu, pointer feedback on keys, and the contact actions.
import gsap from 'gsap';
import { env, prefersReduced } from './env.js';

const EMAIL = 'jeffmaming@163.com';
const VCARD = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'N:麻;明;;;',
  'FN:麻明',
  'ORG:港泓咨询',
  'TITLE:咨询总监（AI 产品方向）',
  'TEL;TYPE=CELL:+8618513595306',
  'EMAIL;TYPE=INTERNET:jeffmaming@163.com',
  'ADR;TYPE=WORK:;;;北京市;;;CN',
  'END:VCARD',
].join('\r\n');

function download(text, type, name) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function initUI(scroll) {
  const nav = document.getElementById('nav');
  const menu = document.getElementById('menu');
  const menuButton = document.getElementById('menu-btn');
  const menuLabel = menuButton.querySelector('.menu-btn-label');
  const toastElement = document.getElementById('toast');
  let toastTimer = 0;

  const toast = (text) => {
    toastElement.textContent = text;
    toastElement.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastElement.classList.remove('is-on'), 2200);
  };

  const setMenu = (open) => {
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuLabel.textContent = open ? '关闭' : '菜单';
    nav.classList.toggle('is-open', open);
    if (open) menu.querySelector('a')?.focus({ preventScroll: true });
  };

  menuButton.addEventListener('click', () => setMenu(menu.hidden));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hidden) {
      setMenu(false);
      menuButton.focus();
    }
  });

  // every in-page link glides to its section and lands just under the navigation bar
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    if (hash.length < 2) return;
    const target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    if (!menu.hidden) setMenu(false);
    scroll.to(target, -nav.offsetHeight + 1);
    history.replaceState(null, '', hash);
  });

  // contact actions
  document.getElementById('copy-email')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      toast('邮箱已复制');
    } catch (error) {
      // clipboard access was refused: hand over to the mail client instead
      window.location.href = `mailto:${EMAIL}`;
    }
  });

  document.getElementById('save-card')?.addEventListener('click', (event) => {
    event.preventDefault();
    download(VCARD, 'text/vcard;charset=utf-8', '麻明.vcf');
    toast('名片开始下载');
  });

  // pointer feedback, fine pointers only
  if (!env.finePointer || prefersReduced()) return;

  document.querySelectorAll('[data-magnetic]').forEach((element) => {
    const x = gsap.quickTo(element, 'x', { duration: 0.6, ease: 'power3' });
    const y = gsap.quickTo(element, 'y', { duration: 0.6, ease: 'power3' });
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      x((event.clientX - (rect.left + rect.width / 2)) * 0.3);
      y((event.clientY - (rect.top + rect.height / 2)) * 0.4);
    });
    element.addEventListener('pointerleave', () => {
      x(0);
      y(0);
    });
  });

  // the fill of a key enters from the side the pointer came from
  document.querySelectorAll('.btn').forEach((element) => {
    element.addEventListener('pointerenter', (event) => {
      const rect = element.getBoundingClientRect();
      element.style.setProperty('--fill-origin', event.clientX - rect.left < rect.width / 2 ? 'left center' : 'right center');
    });
  });
}
