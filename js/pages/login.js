import { Auth } from '../services/auth.js';

const form = document.getElementById('loginForm');
const errorBox = document.getElementById('loginError');
const btn = document.getElementById('btnLogin');

form?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  errorBox.hidden = true;

  const email = form.querySelector('#email').value.trim();
  const password = form.querySelector('#password').value;

  btn.disabled = true; btn.textContent = 'Entrando…';
  try{
    const user = await Auth.login(email, password);
    // redireciona por papel
    const to = user?.role === 'COURIER' ? '../courier.html' : '../interface.html';
    window.location.href = to;
  }catch(err){
    errorBox.textContent = 'Não foi possível entrar. Verifique e tente novamente.';
    errorBox.hidden = false;
  }finally{
    btn.disabled = false; btn.textContent = 'Entrar';
  }
});

// js/pages/login.js – substitua a função atual por esta (ou mantenha como está)
const goToInterface = (file = 'home.html') => {
  const p = location.pathname;
  // se estiver em .../auth/xxx.html sobe um nível, senão usa a mesma pasta
  const base = p.includes('/auth/') ? p.replace(/\/auth\/[^/]*$/, '/') : p.replace(/[^/]*$/, '');
  location.href = base + file;
};
