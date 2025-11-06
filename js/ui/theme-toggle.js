<<<<<<< HEAD
(function () {
  const root = document.documentElement;               // <html>
  const STORAGE_KEY = 'mr_theme';
  const BTN_SEL = '#themeToggle';                      // pode haver vários

  function systemPref() {
    return window.matchMedia &&
           window.matchMedia('(prefers-color-scheme: light)').matches
           ? 'light' : 'dark';
  }

  function getTheme() {
    // 1) localStorage  2) atributo atual  3) preferência do sistema  4) 'dark'
    return localStorage.getItem(STORAGE_KEY)
        || root.getAttribute('data-bs-theme')
        || systemPref()
        || 'dark';
  }

  function applyTheme(theme) {
    root.setAttribute('data-bs-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    // atualiza todos os toggles para acessibilidade
    document.querySelectorAll(BTN_SEL).forEach(btn => {
      btn.setAttribute('role', 'switch');
      btn.setAttribute('aria-checked', String(theme === 'light'));
      btn.title = theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro';
    });
  }

  function toggle() {
    const next = getTheme() === 'light' ? 'dark' : 'light';
    applyTheme(next);
  }

  function init() {
    // aplica imediatamente (evita "flash" errado)
    applyTheme(getTheme());

    // liga listeners em todos os botões presentes
    document.querySelectorAll(BTN_SEL).forEach(btn => {
      btn.addEventListener('click', toggle);
      // opcional: toggle por teclado quando não for <button>
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });

    // sincroniza entre abas
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) applyTheme(e.newValue);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
=======
(function(){
  const KEY = 'mr_theme';
  const root = document.documentElement;

  function apply(theme){
    root.setAttribute('data-bs-theme', theme);
    try{ localStorage.setItem(KEY, theme); }catch{}
    const btn = document.querySelector('#themeToggle');
    if(btn){
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
  }

  function current(){
    const saved = localStorage.getItem(KEY);
    if(saved === 'dark' || saved === 'light') return saved;
    // fallback: se html já vier com data-bs-theme
    return root.getAttribute('data-bs-theme') || 'dark';
  }

  function toggle(){
    const next = current() === 'dark' ? 'light' : 'dark';
    apply(next);
  }

  // boot
  apply(current());
  const btn = document.querySelector('#themeToggle');
  if(btn) btn.addEventListener('click', toggle);
>>>>>>> 9b603892dc046c93a613b280bc65efc0466ebb5a
})();
