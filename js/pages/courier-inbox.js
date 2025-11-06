// js/pages/courier-inbox.js
import { Realtime } from '../services/realtime.js';

const $ = (s,el=document)=>el.querySelector(s);
const list = $('#inboxList');

// Identidade mock do motoboy (no app real você terá auth do courier)
const COURIER_ID = localStorage.getItem('mr_courier_id') || 'c-01';
localStorage.setItem('mr_courier_id', COURIER_ID);

function renderItem(of){
  return `<li class="offer" data-order="${of.order.id}">
    <strong>Pedido ${of.order.id}</strong>
    <div class="offer__meta">
      <div>Origem: ${of.order.from?.name||'-'}</div>
      <div>Destino: ${of.order.to?.name||'-'}</div>
      <div>Valor: R$ ${(of.order.total||0).toFixed(2)}</div>
    </div>
    <div class="offer__actions">
      <button class="btnX btnX--primary" data-act="accept">Aceitar</button>
      <button class="btnX btnX--ghost" data-act="reject">Recusar</button>
    </div>
  </li>`;
}

const offers = new Map();

function paint(){
  list.innerHTML = [...offers.values()].map(renderItem).join('') || `<li class="muted">Sem ofertas no momento.</li>`;
}

list.addEventListener('click', e=>{
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const li = e.target.closest('[data-order]');
  const orderId = li?.getAttribute('data-order');
  const act = btn.getAttribute('data-act');

  if (act==='accept'){
    // Notifica dono (no real: PATCH /orders/:id accept)
    Realtime.send('courier:event', { type:'ACCEPT', courierId:COURIER_ID, orderId });
    window.open('track.html', '_blank'); // abre acompanhamento
    offers.delete(orderId);
  }
  if (act==='reject'){
    Realtime.send('courier:event', { type:'REJECT', courierId:COURIER_ID, orderId });
    offers.delete(orderId);
  }
  paint();
});

// Recebe ofertas destinadas a este courier
Realtime.on(`inbox:${COURIER_ID}`, payload=>{
  if (payload?.type==='OFFER'){
    offers.set(payload.order.id, payload);
    paint();
  }
});
paint();
