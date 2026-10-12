// Mobile navigation: a disclosure menu below 760px (the desktop nav is always visible).
(function () {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');
  if (!toggle || !nav) return;
  const label = open => (document.documentElement.lang === 'en' ? (open ? 'Close menu' : 'Open menu') : (open ? 'Cerrar menú' : 'Abrir menú'));

  function set(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', label(open));
    nav.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  }

  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => { if (event.target.closest('a')) set(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { set(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) set(false); });
  document.getElementById('lang-toggle')?.addEventListener('click', () => toggle.setAttribute('aria-label', label(toggle.getAttribute('aria-expanded') === 'true')));
})();
