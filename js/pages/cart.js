// ===== CART — lógica da página de checkout =====

// Helpers: moeda e debounce
const money = (v)=> v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const debounce = (fn,ms)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms);} };

// DOM
const $street   = document.querySelector('#addr-street');
const $city     = document.querySelector('#addr-city');
const $zip      = document.querySelector('#addr-zip');
const $pickup   = document.querySelector('#addr-pickup');

const $pay      = document.querySelector('#pay-method');
const $coupon   = document.querySelector('#coupon');

const $summary  = document.querySelector('#summary');
const $place    = document.querySelector('#btn-place');
const $bottom   = document.querySelector('.checkout-bottom');

const STORE_KEY = 'mr_checkout_state';
const FEE_FREE  = 80;              // frete grátis a partir de R$80 (exemplo)
const FEES      = { base: 6.9 };   // taxa base

// ===== Boot =====
const state = loadState() || {
  addr: { street:'', city:'', zip:'', pickup:false },
  pay: { method:'pix', card:null },
  coupon: null
};

prefill();
attachEvents();
renderSummary(true); // com skeleton

// ===== Eventos =====
function attachEvents(){
  // endereço
  [$street,$city,$zip].forEach($el=>{
    $el?.addEventListener('input', debounce(()=>{ persistAddr(); validate(); renderSummary(); }, 120));
  });
  $zip?.addEventListener('input', maskCEP);
  $pickup?.addEventListener('change', ()=>{
    state.addr.pickup = $pickup.checked;
    persist(); validate(); renderSummary();
    toggleAddressDisabled();
  });

  // pagamento
  $pay?.addEventListener('change', ()=>{
    state.pay.method = $pay.value;
    if($pay.value === 'card') mountCardFields(); else unmountCardFields();
    persist(); validate(); renderSummary();
  });

  // cupom
  $coupon?.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){ e.preventDefault(); applyCoupon(); }
  });
  $coupon?.addEventListener('blur', ()=>{ if($coupon.value.trim()) applyCoupon(); });

  // confirmar
  $place?.addEventListener('click', onPlaceOrder);
}

// ===== Carregar carrinho e calcular totais =====
function getCartSnapshot(){
  // Tenta diferentes formatos dos serviços de carrinho
  let items = [];
  let subtotal = 0;

  // 1) Serviço global
  if (window.MR_CART?.getItems) {
    items = window.MR_CART.getItems();
  } else if (window.MR_CART?.items) {
    items = window.MR_CART.items;
  } else {
    // 2) Fallback via localStorage comum
    try { items = JSON.parse(localStorage.getItem('mr_cart')||'[]'); } catch{}
  }

  // Calcula subtotal com os campos disponíveis
  subtotal = items.reduce((acc, it)=>{
    if (typeof it.total === 'number') return acc + it.total;
    const price = Number(it.price || it.unitPrice || 0);
    const qty   = Number(it.qty   || it.quantity || 1);
    return acc + price * qty;
  }, 0);

  const qty = items.reduce((acc, it)=> acc + Number(it.qty || it.quantity || 1), 0);

  return { items, subtotal, qty };
}

function computeFee(subtotal){
  if (state.addr.pickup) return 0;
  if (state.coupon?.type === 'free_shipping') return 0;
  if (subtotal >= FEE_FREE) return 0;
  return FEES.base;
}

function computeDiscount(subtotal){
  if (!state.coupon) return 0;
  if (state.coupon.type === 'percent') {
    return subtotal * (state.coupon.value/100);
  }
  return 0;
}

// ===== Summary render =====
function renderSummary(withSkeleton=false){
  const { items, subtotal, qty } = getCartSnapshot();
  const fee = computeFee(subtotal);
  const discount = computeDiscount(subtotal);
  const total = Math.max(0, subtotal + fee - discount);

  // bottom bar
  ensureBottomTotal(total);
  $place?.classList.toggle('is-disabled', !isValid());

  if (withSkeleton) {
    $summary.innerHTML = `<div class="skel"></div>`;
    requestAnimationFrame(()=> renderSummary(false));
    return;
  }

  const couponPill = state.coupon ? `
    <div class="pill">Cupom: <strong>${state.coupon.code}</strong>
      <button type="button" id="coupon-remove" aria-label="Remover cupom">remover</button>
    </div>` : '';

  $summary.innerHTML = `
    <h3>Resumo</h3>
    <div class="lines">
      <div class="line"><span>Itens (${qty})</span><span class="value">${money(subtotal)}</span></div>
      <div class="line ${fee? '':'line--muted'}"><span>Entrega</span><span class="value">${fee? money(fee) : 'grátis'}</span></div>
      <div class="line ${discount? '':'line--muted'}"><span>Descontos</span><span class="value">-${discount? money(discount): money(0)}</span></div>
      ${couponPill}
      <div class="line line--total"><span>Total</span><span class="value">${money(total)}</span></div>
    </div>
  `;

  // remover cupom
  const $rm = document.querySelector('#coupon-remove');
  if ($rm) $rm.addEventListener('click', ()=>{
    state.coupon = null; persist(); toast('Cupom removido');
    renderSummary();
  });
}

function ensureBottomTotal(total){
  if (!$bottom) return;
  let $t = $bottom.querySelector('.total');
  if (!$t){
    $t = document.createElement('div');
    $t.className = 'total';
    $bottom.prepend($t);
  }
  $t.textContent = `Total: ${money(total)}`;
}

// ===== Cupom =====
function applyCoupon(){
  const code = ($coupon.value||'').trim().toUpperCase();
  if (!code) return;

  // Exemplos de cupons:
  // MOTO10 = 10% off; MOTO20 = 20% off acima de 100; FRETEZERO = frete grátis
  if (code === 'FRETEZERO'){
    state.coupon = { code, type:'free_shipping' };
  } else if (code === 'MOTO10'){
    state.coupon = { code, type:'percent', value:10 };
  } else if (code === 'MOTO20'){
    const { subtotal } = getCartSnapshot();
    if (subtotal >= 100){
      state.coupon = { code, type:'percent', value:20 };
    } else {
      toast('MOTO20 válido para pedidos a partir de R$ 100');
      return;
    }
  } else {
    toast('Cupom inválido');
    return;
  }
  persist(); toast('Cupom aplicado');
  renderSummary();
}

// ===== Endereço & Pay UI =====
function toggleAddressDisabled(){
  const on = state.addr.pickup;
  [$street,$city,$zip].forEach($el=>{
    if(!$el) return;
    $el.disabled = on;
    $el.closest('.input')?.classList?.toggle('is-disabled', on);
  });
}
function mountCardFields(){
  if (document.querySelector('.pay-extra')) return;
  const host = $pay.closest('.panel');
  const div = document.createElement('div');
  div.className = 'pay-extra';
  div.innerHTML = `
    <div class="pay-row2">
      <input id="cc-number" class="input" placeholder="Número do cartão" inputmode="numeric" maxlength="19">
      <input id="cc-exp" class="input" placeholder="MM/AA" inputmode="numeric" maxlength="5">
    </div>
    <div class="pay-row2">
      <input id="cc-name" class="input" placeholder="Nome impresso no cartão">
      <input id="cc-cvv" class="input" placeholder="CVV" inputmode="numeric" maxlength="4">
    </div>
  `;
  host.appendChild(div);

  // máscaras
  div.querySelector('#cc-number')?.addEventListener('input', maskCard);
  div.querySelector('#cc-exp')?.addEventListener('input', maskExp);
  div.querySelector('#cc-cvv')?.addEventListener('input', digitsOnly);

  // carregar se existir
  if (state.pay.card){
    div.querySelector('#cc-number').value = state.pay.card.number || '';
    div.querySelector('#cc-exp').value    = state.pay.card.exp || '';
    div.querySelector('#cc-name').value   = state.pay.card.name || '';
    div.querySelector('#cc-cvv').value    = state.pay.card.cvv || '';
  }
}
function unmountCardFields(){
  document.querySelector('.pay-extra')?.remove();
}
function collectCard(){
  const wrap = document.querySelector('.pay-extra');
  if (!wrap) return null;
  return {
    number: wrap.querySelector('#cc-number')?.value.trim(),
    exp:    wrap.querySelector('#cc-exp')?.value.trim(),
    name:   wrap.querySelector('#cc-name')?.value.trim(),
    cvv:    wrap.querySelector('#cc-cvv')?.value.trim(),
  };
}

// ===== Validação =====
function isValid(){
  const { addr, pay } = state;
  if (!addr.pickup){
    if (!addr.street || !addr.city || !/^\d{5}-?\d{3}$/.test(addr.zip||'')) return false;
  }
  if (pay.method === 'card'){
    const card = collectCard();
    if (!card) return false;
    if (!/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(card.number||'')) return false;
    if (!/^\d{2}\/\d{2}$/.test(card.exp||'')) return false;
    if (!card.name || !/^\d{3,4}$/.test(card.cvv||'')) return false;
  }
  return true;
}
function validate(){ $place?.classList.toggle('is-disabled', !isValid()); }

// ===== Persistência =====
function persistAddr(){
  state.addr.street = $street.value.trim();
  state.addr.city   = $city.value.trim();
  state.addr.zip    = $zip.value.trim();
  persist();
}
function persist(){
  if ($pay.value === 'card') state.pay.card = collectCard();
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }catch{}
}
function loadState(){
  try{ return JSON.parse(localStorage.getItem(STORE_KEY)||'null'); }catch{ return null; }
}
function prefill(){
  $street.value = state.addr.street||'';
  $city.value   = state.addr.city||'';
  $zip.value    = state.addr.zip||'';
  $pickup.checked = !!state.addr.pickup;
  toggleAddressDisabled();

  if ($pay){
    $pay.value = state.pay.method || 'pix';
    if ($pay.value === 'card') mountCardFields();
  }
  if ($coupon) $coupon.value = state.coupon?.code || '';
}

// ===== Máscaras =====
function maskCEP(e){
  const v = digits(e.target.value).slice(0,8);
  e.target.value = v.replace(/^(\d{5})(\d{0,3}).*/, (_,a,b)=> b? `${a}-${b}` : a);
}
function maskCard(e){
  const v = digits(e.target.value).slice(0,16);
  e.target.value = v.replace(/(\d{1,4})/g,'$1').replace(/(\d{4})(?=\d)/g,'$1 ').trim();
}
function maskExp(e){
  let v = digits(e.target.value).slice(0,4);
  if (v.length>=3) v = `${v.slice(0,2)}/${v.slice(2)}`;
  e.target.value = v;
}
function digitsOnly(e){ e.target.value = digits(e.target.value); }
function digits(s){ return (s||'').replace(/\D+/g,''); }

// ===== Toast =====
function toast(text){
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 2200);
}

// ===== Place order =====
function onPlaceOrder(e){
  if (!isValid()){
    e.preventDefault();
    toast('Preencha os dados obrigatórios');
    validate();
    return;
  }

  $place.classList.add('is-loading');
  setTimeout(()=>{
    const { items, subtotal, qty } = getCartSnapshot();
    const fee = computeFee(subtotal);
    const discount = computeDiscount(subtotal);
    const total = Math.max(0, subtotal + fee - discount);

    const order = {
      id: 'MR-' + Date.now(),
      items, qty, subtotal, fee, discount, total,
      addr: state.addr,
      pay: state.pay,
      coupon: state.coupon,
      createdAt: new Date().toISOString()
    };

    // Integração futura: orders.js
    try{
      if (window.MR_ORDERS?.create) window.MR_ORDERS.create(order);
      localStorage.setItem('mr_last_order', JSON.stringify(order));
    }catch{}

    // navega para o tracking
    window.location.href = 'track.html';
  }, 450);
}
