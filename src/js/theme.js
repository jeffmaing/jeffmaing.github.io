// Day and night are the two cabins. The instruments keep their dark faces in both.
const KEY = 'mm-theme';

export function initTheme() {
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle');
  const meta = document.querySelector('meta[name="theme-color"]');
  let timer = 0;

  const apply = (theme, persist) => {
    root.setAttribute('data-theme', theme);
    button?.setAttribute('aria-checked', String(theme === 'day'));
    if (meta) meta.setAttribute('content', theme === 'day' ? '#e8ebec' : '#061821');
    if (persist) {
      try {
        localStorage.setItem(KEY, theme);
      } catch (error) {
        // storage is unavailable: the choice simply lasts for this visit
      }
    }
  };

  apply(root.getAttribute('data-theme') === 'day' ? 'day' : 'night', false);

  button?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'day' ? 'night' : 'day';
    root.classList.add('is-theming');
    apply(next, true);
    window.dispatchEvent(new CustomEvent('cabinchange', { detail: { theme: next } }));
    clearTimeout(timer);
    timer = setTimeout(() => root.classList.remove('is-theming'), 700);
  });
}
