// js/pages/register.js
import { Auth } from '../services/auth.js';

const form = document.getElementById('signupForm');
if (!form) {
  // Página não é o cadastro: apenas não executa nada.
  // (NÃO use `export {}` aqui)
} else {
  const errorBox = document.getElementById('signupError');
  const okBox    = document.getElementById('signupOk');
  const btn      = document.getElementById('btnSignup') || form.querySelector('button[type="submit"]');

  const companyBox = document.getElementById('companyFields');
  const courierBox = document.getElementById('courierFields');

  const roleRadios = form.querySelectorAll('input[name="role"]');

  // 'empresa' | 'motoboy'  ->  'OWNER' | 'COURIER'
  const getRole = () => {
    const val = form.querySelector('input[name="role"]:checked')?.value || 'empresa';
    return val === 'motoboy' ? 'COURIER' : 'OWNER';
  };

  const toggleRoleBoxes = () => {
    const isCourier = form.querySelector('input[name="role"]:checked')?.value === 'motoboy';
    if (companyBox) companyBox.hidden = isCourier;
    if (courierBox) courierBox.hidden = !isCourier;
  };

  roleRadios.forEach(r => r.addEventListener('change', toggleRoleBoxes));
  toggleRoleBoxes();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (errorBox) { errorBox.hidden = true; errorBox.textContent = ''; }
    if (okBox)    { okBox.hidden    = true; okBox.textContent    = ''; }

    if (!form.reportValidity()) return;

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    payload.role = getRole(); // 'OWNER' | 'COURIER'
    if (payload.uf)    payload.uf    = payload.uf.toUpperCase();
    if (payload.plate) payload.plate = payload.plate.toUpperCase();

    try {
      if (btn) { btn.disabled = true; btn.textContent = 'Cadastrando…'; }

      await Auth.register(payload);

      if (okBox) { okBox.hidden = false; okBox.textContent = 'Cadastro realizado!'; }

      // volta para o login (ajuste conforme sua estrutura)
      const href = location.pathname.includes('/auth/') ? 'login.html' : './auth/login.html';
      setTimeout(() => { window.location.href = href; }, 800);
    } catch (err) {
      if (errorBox) {
        errorBox.hidden = false;
        errorBox.textContent = err?.message || 'Não foi possível cadastrar. Tente novamente.';
      }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Cadastrar'; }
    }
  });
}
