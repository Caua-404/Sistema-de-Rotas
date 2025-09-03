/* auth.js – Tema + Login/Cadastro (mock) */
document.addEventListener('DOMContentLoaded', () => {
  /* ====== Tema claro/escuro (persistente) ====== */
  const THEME_KEY = 'mr_theme';
  const root = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');

  function applyTheme(theme){
    root.setAttribute('data-bs-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch(_) {}
  }
  // aplica tema salvo (ou mantém o que vier do HTML)
  applyTheme(localStorage.getItem(THEME_KEY) || root.getAttribute('data-bs-theme') || 'dark');

  themeBtn?.addEventListener('click', () => {
    const next = root.getAttribute('data-bs-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
  });

  /* ====== LOGIN ====== */
  const isLogin  = !!document.getElementById('loginForm');
  const isSignup = !!document.getElementById('signupForm');

  const norm = (s) => (s || '').normalize('NFKC').replace(/\s+/g,' ').trim();

  if (isLogin) {
    const form  = document.getElementById('loginForm');
    const userI = document.getElementById('user');
    const passI = document.getElementById('pass');
    const err   = document.getElementById('loginError');

    // Olho dentro do input
    form.querySelectorAll('.pass__toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.closest('.pass__wrap').querySelector('input');
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        btn.setAttribute('aria-label', isPwd ? 'Ocultar senha' : 'Exibir senha');
        btn.title = isPwd ? 'Ocultar senha' : 'Exibir senha';
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      err.hidden = true; err.textContent = '';

      const USER_OK = 'Teste';
      const PASS_OK = 'Faz o L 123';

      const u = norm(userI.value);
      const p = passI.value;

      const valid = (u === norm(USER_OK)) && (p === PASS_OK);
      if (!valid) {
        err.hidden = false;
        err.textContent = 'Usuário ou senha inválidos.';
        form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
        return;
      }

      try { sessionStorage.setItem('mr_auth', JSON.stringify({ user: USER_OK, at: Date.now() })); } catch(_){}
      window.location.href = 'index.html';
    });
  }

  /* ====== CADASTRO (opcional, se usar signup.html) ====== */
  if (isSignup) {
    const form   = document.getElementById('signupForm');
    const nameI  = document.getElementById('name');
    const emailI = document.getElementById('email');
    const pass1  = document.getElementById('spass');
    const pass2  = document.getElementById('spass2');
    const err    = document.getElementById('signupError');
    const ok     = document.getElementById('signupOk');

    form.querySelectorAll('.pass__toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.closest('.pass__wrap').querySelector('input');
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        btn.setAttribute('aria-label', isPwd ? 'Ocultar senha' : 'Exibir senha');
        btn.title = isPwd ? 'Ocultar senha' : 'Exibir senha';
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      err.hidden = true; err.textContent = '';
      ok.hidden  = true; ok.textContent  = '';

      const name = norm(nameI.value);
      const mail = norm(emailI.value);
      const p1   = pass1.value;
      const p2   = pass2.value;

      if (!name || !mail || !p1 || !p2) { err.hidden=false; err.textContent='Preencha todos os campos.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { err.hidden=false; err.textContent='Informe um e-mail válido.'; return; }
      if (p1.length < 8) { err.hidden=false; err.textContent='A senha deve ter pelo menos 8 caracteres.'; return; }
      if (p1 !== p2) { err.hidden=false; err.textContent='As senhas não coincidem.'; return; }

      try {
        const db = JSON.parse(localStorage.getItem('mr_users') || '[]');
        db.push({ name, mail, createdAt: Date.now() });
        localStorage.setItem('mr_users', JSON.stringify(db));
      } catch(_){}

      ok.hidden=false; ok.textContent='Cadastro realizado! Você já pode fazer login.';
      setTimeout(()=>{ window.location.href = 'login.html'; }, 900);
    });
  }
});

/* animação leve de erro */
const style = document.createElement('style');
style.textContent = `
@keyframes shakeX{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
.shake{animation:shakeX .36s cubic-bezier(.36,.07,.19,.97);}
`;
document.head.appendChild(style);
