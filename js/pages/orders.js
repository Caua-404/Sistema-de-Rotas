// js/pages/orders.js
import { OrdersService } from '../services/orders.service.js';
import { getMarketplaceLabel, getMarketplaceBadgeClass } from '../services/marketplaces.js';

const $ = (s, el=document)=> el.querySelector(s);
const $$ = (s, el=document)=> [...el.querySelectorAll(s)];

const els = {
  grid: $('#ordersGrid'),
  search: $('#orders-search'),
  market: $('#filter-market'),
  status: $('#filter-status'),
  sync: $('#btn-sync'),
  dlg: $('#assignDialog'),
  dlgForm: $('#assignForm'),
  dlgOrderId: $('#assignOrderId'),
  couriersList: $('#couriersList'),
};

let allOrders = [];
let filters = { q:'', market:'', status:'' };
let pendingAssign = null;

init();

async function init(){
  // carrega e renderiza
  allOrders = await OrdersService.all();
  render();

  // listeners
  els.search?.addEventListener('input', e => { filters.q = e.target.value; render(); });
  els.market?.addEventListener('change', e => { filters.market = e.target.value; render(); });
  els.status?.addEventListener('change', e => { filters.status = e.target.value; render(); });

  els.sync?.addEventListener('click', async ()=>{
    els.sync.disabled = true; els.sync.textContent = 'Sincronizando…';
    await OrdersService.sync();
    allOrders = await OrdersService.all();
    render();
    els.sync.disabled = false; els.sync.textContent = 'Sincronizar';
  });

  OrdersService.onChange(list => { allOrders = list; render(); });

  // delegação: ações dos cards
  els.grid.addEventListener('click', onGridClick);

  // dialog atribuição
  els.dlg?.addEventListener('close', ()=> { pendingAssign = null; });
  els.dlgForm?.addEventListener('submit', (e)=>{
    // o <dialog> com method="dialog" retorna value via botão
    if (e.submitter?.value === 'ok' && pendingAssign){
      // TODO: vincular courier selecionado
      OrdersService.dispatch(pendingAssign.id);
      pendingAssign = null;
    }
  });
}

function onGridClick(e){
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const card = btn.closest('[data-id]');
  const id = card?.dataset?.id;

  const action = btn.dataset.action;
  if (action === 'prep') OrdersService.markPreparing(id);
  if (action === 'ready') OrdersService.markReady(id);
  if (action === 'assign'){
    pendingAssign = { id };
    els.dlgOrderId.textContent = id;
    // TODO: preencher lista de motoboys (usando couriers.service se quiser)
    els.couriersList.innerHTML = `
      <li><label><input type="radio" name="courier" value="c1" checked/> João (1.2 km)</label></li>
      <li><label><input type="radio" name="courier" value="c2"/> Maria (1.8 km)</label></li>
      <li><label><input type="radio" name="courier" value="c3"/> Pedro (2.5 km)</label></li>
    `;
    els.dlg.showModal();
  }
}

function render(){
  const list = OrdersService.filter(allOrders, filters);
  els.grid.innerHTML = list.map(renderCard).join('');
}

function renderCard(o){
  const badgeClass = getMarketplaceBadgeClass(o.market);
  const mpLabel = getMarketplaceLabel(o.market);
  const status = statusLabel(o.status);
  const actions = renderActions(o);

  return `
  <article class="order-card" data-id="${o.id}">
    <header class="ord-head">
      <h3 class="ord-id">${o.id}</h3>
      <div class="ord-tags">
        <span class="badge ${badgeClass}">${mpLabel}</span>
        <span class="badge st-${o.status.toLowerCase()}">${status}</span>
      </div>
    </header>

    <div class="ord-body">
      <div class="row"><strong>Cliente:</strong> ${o.customer?.name || '-'}</div>
      <div class="row"><strong>Itens:</strong> ${o.items.map(i=>`${i.qty}× ${i.name}`).join(' • ')}</div>
      <div class="row"><strong>Total:</strong> R$ ${(o.total/100).toFixed(2).replace('.',',')} • <strong>Há</strong> ${o.ageMin} min</div>
    </div>

    <footer class="ord-actions">
      ${actions}
    </footer>
  </article>`;
}

function statusLabel(k){
  switch(k){
    case 'PLACED': return 'Recebido';
    case 'PREPARING': return 'Em preparo';
    case 'READY': return 'Pronto';
    case 'DISPATCHED': return 'Despachado';
    case 'DELIVERED': return 'Entregue';
    case 'CANCELLED': return 'Cancelado';
    default: return k;
  }
}

function renderActions(o){
  if (o.status === 'PLACED'){
    return `<button class="btnX btnX--primary" data-action="prep">Aceitar & Preparar</button>`;
  }
  if (o.status === 'PREPARING'){
    return `<button class="btnX btnX--ghost" data-action="ready">Marcar como pronto</button>`;
  }
  if (o.status === 'READY'){
    return `<button class="btnX btnX--primary" data-action="assign">Enviar para motoboy</button>`;
  }
  return `<span class="muted">Sem ações</span>`;
}
