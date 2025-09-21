/* auth.js — Tema + Login/Cadastro (leve e sem duplicações) */
document.addEventListener('DOMContentLoaded', () => {
  // ---------- helpers ----------
  const $  = (sel, el = document) => el.querySelector(sel);
  const on = (el, ev, sel, fn) => el.addEventListener(ev, e => {
    const t = e.target.closest(sel);
    if (t && el.contains(t)) fn(e, t);
  });
  const norm = s => (s || '').normalize('NFKC').replace(/\s+/g, ' ').trim();

  // ---------- tema claro/escuro persistente ----------
  const THEME_KEY = 'mr_theme';
  const root = document.documentElement;
  const themeBtn = $('#themeToggle');

  const applyTheme = (theme) => {
    root.setAttribute('data-bs-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  };
  applyTheme(localStorage.getItem(THEME_KEY) || root.getAttribute('data-bs-theme') || 'dark');

  themeBtn?.addEventListener('click', () => {
    const next = root.getAttribute('data-bs-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
  });

  // ---------- animação de erro (shake) ----------
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shakeX{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
    .shake{animation:shakeX .36s cubic-bezier(.36,.07,.19,.97);}
  `;
  document.head.appendChild(style);

  // ---------- delegação: mostrar/ocultar senha (login e cadastro) ----------
  on(document, 'click', '.pass__toggle', (_e, btn) => {
    const input = btn.closest('.pass__wrap')?.querySelector('input');
    if (!input) return;
    const isPwd = input.type === 'password';
    input.type = isPwd ? 'text' : 'password';
    const label = isPwd ? 'Ocultar senha' : 'Exibir senha';
    btn.setAttribute('aria-label', label);
    btn.title = label;
  });

  // ---------- login ----------
  const loginForm = $('#loginForm');
  if (loginForm) {
    const userI = $('#user');
    const passI = $('#pass');
    const err   = $('#loginError');

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      err.hidden = true; err.textContent = '';

      // credenciais mock para teste
      const USER_OK = 'Teste';
      const PASS_OK = 'Faz o L 123';

      const u = norm(userI.value);
      const p = passI.value;

      const valid = (u === norm(USER_OK)) && (p === PASS_OK);
      if (!valid) {
        err.hidden = false;
        err.textContent = 'Usuário ou senha inválidos.';
        loginForm.classList.remove('shake'); void loginForm.offsetWidth; loginForm.classList.add('shake');
        return;
      }

      // Prefill do último usuário usado (se existir)
      const lastUser = localStorage.getItem('mr_last_user');
      if (lastUser) {
        const userField = document.getElementById('user');
        if (userField) userField.value = lastUser;
      }
      // login ok → vai para a interface
      window.location.href = 'interface.html';
    });
  }

  // ---------- cadastro ----------
  const signupForm = $('#signupForm');
  if (signupForm) {
    const nameI  = $('#name');
    const emailI = $('#email');
    const pass1  = $('#spass');
    const pass2  = $('#spass2');
    const err    = $('#signupError');
    const ok     = $('#signupOk');

    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      err.hidden = true; err.textContent = '';
      ok.hidden  = true; ok.textContent  = '';

      const name = norm(nameI.value);
      const mail = norm(emailI.value);
      const p1   = pass1.value;
      const p2   = pass2.value;

      if (!name || !mail || !p1 || !p2) { err.hidden = false; err.textContent = 'Preencha todos os campos.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { err.hidden = false; err.textContent = 'Informe um e-mail válido.'; return; }
      if (p1.length < 8) { err.hidden = false; err.textContent = 'A senha deve ter pelo menos 8 caracteres.'; return; }
      if (p1 !== p2) { err.hidden = false; err.textContent = 'As senhas não coincidem.'; return; }

      try {
        const db = JSON.parse(localStorage.getItem('mr_users') || '[]');
        db.push({ name, mail, createdAt: Date.now() });
        localStorage.setItem('mr_users', JSON.stringify(db));
      } catch (_) {}

      ok.hidden = false; ok.textContent = 'Cadastro realizado! Você já pode fazer login.';
      setTimeout(() => { window.location.href = 'index.html'; }, 900); // volta para o login
    });
  }
});
