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
})();
