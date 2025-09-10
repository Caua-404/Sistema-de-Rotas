import { saveLocal } from './_utils.js';

$('#btnLogout')?.addEventListener('click', ()=>{
  if (!confirm('Deseja realmente encerrar a sessão?')) return;

  try {
    sessionStorage.clear();
    localStorage.removeItem('mr_auth'); // se existir
    // opcional: limpar outros dados sensíveis
  } catch(e){ console.error(e); }

  alert('Sessão encerrada com sucesso.');
  window.location.href = 'index.html';
});
