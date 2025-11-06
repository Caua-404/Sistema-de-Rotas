// js/features/tracking.js
import { api } from '../services/api.js';

const $ = (s, el=document) => el.querySelector(s);

function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function setBadge(el, status){
  el.className = 'pill';
  if(status === 'late') el.classList.add('pill--late');
  if(status === 'done') el.classList.add('pill--done');
  if(status === 'on')   el.classList.add('pill--on');
  el.textContent = (status === 'late' ? 'Atrasada' :
                    status === 'done' ? 'Finalizada' :
                    status === 'on'   ? 'Em andamento' : '—');
}

async function load(token){
  const loading = $('#trkLoading');
  const view    = $('#trkView');
  const errBox  = $('#trkError');

  loading.classList.remove('d-none');
  view.classList.add('d-none');
  errBox.classList.add('d-none');
  errBox.textContent = '';

  try{
    const data = await api.getTracking(token);
    loading.classList.add('d-none');

    if(!data){
      errBox.textContent = 'Código não encontrado. Verifique o token e tente novamente.';
      errBox.classList.remove('d-none');
      return;
    }

    // Preenche UI
    $('#trkId').textContent      = data.id;
    $('#trkCourier').textContent = data.courier ?? '—';
    $('#trkETA').textContent     = Number.isFinite(data.etaMin) ? data.etaMin : '—';
    setBadge($('#trkBadge'), data.status);

    // texto explicativo
    const msg = data.status === 'done'
      ? 'Pedido entregue com sucesso.'
      : data.status === 'late'
      ? 'Pedido em atraso. Nossa equipe já foi notificada.'
      : 'Seu pedido está a caminho.';
    $('#trkStatusText').textContent = msg;

    view.classList.remove('d-none');
  } catch(e){
    loading.classList.add('d-none');
    errBox.textContent = 'Falha ao carregar o status. Tente novamente.';
    errBox.classList.remove('d-none');
    // console.error(e);
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  const form   = $('#trkForm');
  const input  = $('#trkInput');
  const tokenQ = getParam('t'); // tracking.html?t=trk-1245

  if (tokenQ) {
    // se veio com ?t=..., esconde o form e carrega direto
    form.classList.add('d-none');
    $('#trkLoading').classList.remove('d-none');
    load(tokenQ);
  } else {
    // sem token: mostra formulário e oculta “carregando”
    $('#trkLoading').classList.add('d-none');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const token = (input.value || '').trim();
    if(!token) return;
    // navega com o token na URL (compartilhável)
    window.location.href = `tracking.html?t=${encodeURIComponent(token)}`;
  });
});
