// no topo de js/utils/interface.js (se você importar serviços/lojas)
import { api } from '../services/api.js';
import { deliveriesStore } from '../stores/deliveries.js';
import { workersStore } from '../stores/workers.js'; 

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

function statusClass(s) {
  return s === 'late' ? 'card--late' : s === 'done' ? 'card--done' : 'card--warn';
}

function paintKPIs() {
  const { late, done, on } = getKpis();
  $('#kpiLate') && ($('#kpiLate').textContent = String(late).padStart(2, '0'));
  $('#kpiDone') && ($('#kpiDone').textContent = String(done).padStart(2, '0'));
  $('#kpiOn')   && ($('#kpiOn').textContent   = String(on).padStart(2, '0'));
}

function renderList(state) {
  const ul = $('#ordersList');
  if (!ul) return;

  ul.innerHTML = '';
  state.items.forEach((d) => {
    const li = document.createElement('li');
    li.className = `card ${statusClass(d.status)}`;
    li.innerHTML = `
      <div class="card__title">Pedido #${d.id} — ${d.client}</div>
      <div class="card__meta">Entregador: <span data-courier="${d.courierId}">…</span></div>
      <img class="card__avatar" alt="Foto do entregador" src="assets/user.jpg">
    `;
    ul.appendChild(li);
  });

  // preenche avatares e nomes usando a API (uma vez por render)
  api.listCouriers().then(couriers => {
    ul.querySelectorAll('[data-courier]').forEach(span => {
      const id = Number(span.getAttribute('data-courier'));
      const c = couriers.find(x => x.id === id);
      if (c) {
        span.textContent = c.name;
        // acha o <img> irmão mais próximo
        const img = span.closest('.card').querySelector('.card__avatar');
        if (img) img.src = c.avatar || 'assets/user.jpg';
      }
    });
  });

  paintKPIs();
}

function wireFilters() {
  const legend = $('.status__legend');
  if (!legend) return;

  legend.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    const f = btn.dataset.filter || 'all';
    legend.querySelectorAll('button').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    loadByStatus(f);
  });
}

// FAB de abrir/fechar painel de status
function wireStatusPanel() {
  const btn = $('#statusToggle');
  const panel = $('#statusPanel');
  if (!btn || !panel) return;

  const isOpen = () => !panel.classList.contains('is-collapsed');
  const open   = () => { panel.classList.remove('is-collapsed'); btn.setAttribute('aria-expanded', 'true'); };
  const close  = () => { panel.classList.add('is-collapsed');    btn.setAttribute('aria-expanded', 'false'); };

  // desktop começa fechado, mobile começa aberto
  const mq = window.matchMedia('(min-width: 961px)');
  const apply = () => (mq.matches ? close() : open());
  apply();
  mq.addEventListener?.('change', apply);

  btn.addEventListener('click', () => (isOpen() ? close() : open()));
}

export function initInterface() {
  wireFilters();
  wireStatusPanel();
  // assinatura do store → re-render
  subscribe(renderList);
  // primeira carga
  loadAll();
}

// auto-start se este arquivo for incluído diretamente na interface
document.addEventListener('DOMContentLoaded', () => {
  // só roda na página que tem a legenda/lista
  if (document.querySelector('.status__legend') && document.querySelector('#ordersList')) {
    initInterface();
  }
});