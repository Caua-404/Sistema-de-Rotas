// ===== TRACK — mapa + timeline + rastreio por código/produto =====

// UI refs
const $orderId     = document.querySelector('#orderId');
const $eta         = document.querySelector('#eta');
const $steps       = document.querySelector('#tlSteps');
const $actions     = document.querySelector('#tlActions');
const $btnFit      = document.querySelector('#btnFit');
const $trackForm   = document.querySelector('#trackForm');
const $trackCode   = document.querySelector('#trackCode');
const $trackProd   = document.querySelector('#trackProduct');
const $productInfo = document.querySelector('#productInfo');

// Estado
let map, layer, courierMarker, routeLine, plannedLine, bounds;
let simTimer = null;

let state = {
  order: getLastOrder(),   // nunca redireciona; usa fallback
  status: 'PLACED',
  etaMin: undefined,
};

// labels de status
const STATUS_TEXT = {
  PLACED: 'Recebido',
  PREPARING: 'Preparando',
  PICKED_UP: 'Coletado',
  OUT_FOR_DELIVERY: 'A caminho',
  DELIVERED: 'Entregue'
};

/* ---------- Boot: espera DOM + Leaflet ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  await waitForLeaflet();
  boot();
});

function waitForLeaflet(retries = 40, delay = 100){
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (window.L && typeof L.map === 'function') return resolve();
      if (retries-- <= 0) return reject(new Error('Leaflet timeout'));
      setTimeout(tick, delay);
    };
    tick();
  });
}

/* ---------- Inicialização ---------- */
function boot(){
  if ($orderId) $orderId.textContent = `Pedido — ${state.order?.id || '—'}`;
  if ($trackCode && !($trackCode.value || '').trim()) $trackCode.value = state.order?.id || '';

  buildSteps();
  initMap();
  renderHeader();

  $btnFit?.addEventListener('click', fitAll);

  // Formulário de rastreio
  $trackForm?.addEventListener('submit', onSearchSubmit);

  // Produto (opcional)
  $trackProd?.addEventListener('change', ()=> renderProductInfo(($trackProd.value||'').trim()));
  $trackProd?.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); renderProductInfo(($trackProd.value||'').trim()); } });

  wireRealtimeOrSim();
  setTimeout(()=> map && map.invalidateSize(true), 150);
}

async function onSearchSubmit(e){
  e.preventDefault();
  const code = ($trackCode?.value || '').trim();
  if (!code) return;

  setSearchLoading(true);
  try{
    const ord = await fetchOrderByCode(code);
    if (!ord){ flash('Pedido não encontrado'); return; }

    // se for o mesmo código, ainda assim damos feedback visual
    loadOrder(ord);
    flash('Pedido carregado');
    // destaca a timeline
    blinkTimeline();
  } finally {
    setSearchLoading(false);
  }
}

function setSearchLoading(loading){
  const btn = $trackForm?.querySelector('button[type="submit"]');
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Buscando…' : 'Buscar';
}

/* ---------- Mapa ---------- */
function initMap(){
  const center = state.order?.pickup || { lat: -23.5505, lng: -46.6333 };
  map = L.map('map', { zoomControl: true, scrollWheelZoom: true })
         .setView([center.lat, center.lng], 13);

  const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  tiles.once('load', () => {
    fitAll();
    setTimeout(() => map.invalidateSize(true), 50);
  });

  layer = L.layerGroup().addTo(map);
  drawStaticMarkersAndPlannedRoute();

  // marcador do motoboy + rota em tempo real
  courierMarker = L.marker([center.lat, center.lng], {
    icon: L.divIcon({ className:'pulse', iconSize:[18,18] })
  }).addTo(layer).bindTooltip('Motoboy');

  routeLine = L.polyline([], { color:'#FF5900', weight:4, opacity:.85 }).addTo(layer);

  fitAll();
  wireResizeInvalidations();
}

function drawStaticMarkersAndPlannedRoute(){
  if (plannedLine) { layer.removeLayer(plannedLine); plannedLine = null; }

  const pk = state.order?.pickup;
  const dp = state.order?.dropoff;

  if (pk) L.marker([pk.lat, pk.lng], { title: pk.name || 'Origem' })
            .addTo(layer).bindPopup(`<b>Origem</b><br>${pk.name || ''}`);
  if (dp) L.marker([dp.lat, dp.lng], { title: dp.name || 'Destino' })
            .addTo(layer).bindPopup(`<b>Destino</b><br>${dp.name || ''}`);

  // rota decorativa A → B
  if (pk && dp){
    plannedLine = L.polyline([[pk.lat, pk.lng], [dp.lat, dp.lng]], {
      color: '#ffffff', opacity: .55, weight: 3, dashArray: '6,8'
    }).addTo(layer);
  }
}

function resetDynamicRoute(){
  if (routeLine){ routeLine.setLatLngs([]); }
  if (courierMarker && state.order?.pickup){
    courierMarker.setLatLng([state.order.pickup.lat, state.order.pickup.lng]);
  }
}

function fitAll(){
  if (!layer) return;
  const bs = [];
  layer.eachLayer(l => {
    if (l.getLatLng)  bs.push(l.getLatLng());
    if (l.getLatLngs) bs.push(...l.getLatLngs());
  });
  if (!bs.length) return;
  bounds = L.latLngBounds(bs);
  map.fitBounds(bounds.pad(0.25));
}

function wireResizeInvalidations(){
  const invalidate = ()=> map && map.invalidateSize(true);
  window.addEventListener('resize', () => setTimeout(invalidate, 50));
  document.body.addEventListener('transitionend', invalidate);
  const mo = new MutationObserver(()=> setTimeout(invalidate, 180));
  mo.observe(document.body, { attributes:true, attributeFilter:['class'] });
}

/* ---------- Timeline ---------- */
const STEP_MODEL = [
  { key:'PLACED',           title:'Pedido recebido', sub:'Loja recebeu seu pedido' },
  { key:'PREPARING',        title:'Preparando',      sub:'Restaurante preparando' },
  { key:'PICKED_UP',        title:'Coletado',        sub:'Motoboy saiu da loja' },
  { key:'OUT_FOR_DELIVERY', title:'A caminho',       sub:'Indo ao endereço' },
  { key:'DELIVERED',        title:'Entregue',        sub:'Pedido concluído' },
];

function buildSteps(){
  if (!$steps) return;
  $steps.innerHTML = STEP_MODEL.map(s => `
    <li data-step="${s.key}">
      <span class="dot" aria-hidden="true"></span>
      <div class="step-title">${s.title}</div>
      <div class="step-sub">${s.sub}</div>
    </li>
  `).join('');
  const phone = state.order?.courier?.phone;
  if ($actions){
    $actions.innerHTML = `
      ${phone ? `<a class="btnX btnX--ghost" href="tel:${phone}">Ligar motoboy</a>` : ''}
      <a class="btnX btnX--ghost" href="home.html">Ver restaurantes</a>
    `;
  }
  updateSteps('PLACED');
}

function updateSteps(status){
  state.status = status;
  if ($steps){
    $steps.querySelectorAll('li').forEach(li=>{
      const stepKey = li.getAttribute('data-step');
      li.classList.toggle('is-done',   isBefore(stepKey, status));
      li.classList.toggle('is-active', stepKey === status);
    });
  }
  renderHeader();
}

function isBefore(step, status){
  const idx = STEP_MODEL.findIndex(s=>s.key===step);
  const idc = STEP_MODEL.findIndex(s=>s.key===status);
  return idx >= 0 && idc >= 0 && idx < idc;
}

function renderHeader(){
  const statusLabel = STATUS_TEXT[state.status] || state.status;
  const etaPart = Number.isFinite(state.etaMin) ? ` • ETA ${state.etaMin} min` : ' • calculando…';
  if ($eta){
    $eta.innerHTML = `<span class="status-badge">${statusLabel}</span>${etaPart}`;
  }
  if ($orderId){
    $orderId.textContent = `Pedido — ${state.order?.id || '—'}`;
  }
}

/* ---------- Produto (opcional) ---------- */
function renderProductInfo(query){
  if (!$productInfo) return;
  const items = state.order?.items || [];
  if (!query){
    $productInfo.classList.remove('is-visible');
    $productInfo.innerHTML = '';
    return;
  }

  const re = new RegExp(query, 'i');
  const it = items.find(x => re.test(x?.name || x?.title || ''));
  if (!it){
    $productInfo.classList.add('is-visible');
    $productInfo.innerHTML = `<div class="title">Produto não encontrado</div>
      <div class="meta">Verifique o nome digitado.</div>`;
    return;
  }

  const qty = it.qty ?? it.quantity ?? 1;
  const price = (typeof it.total === 'number') ? it.total :
                (it.price ?? it.unitPrice ?? 0) * qty;

  const statusLabel = STATUS_TEXT[state.status] || state.status;

  $productInfo.classList.add('is-visible');
  $productInfo.innerHTML = `
    <div class="title">${it.name || it.title} <small>×${qty}</small></div>
    <div class="meta">Status: <strong>${statusLabel}</strong> • Valor: R$ ${Number(price).toFixed(2)}</div>
  `;
}

/* ---------- Realtime / Simulação ---------- */
function onRealtime(payload){
  if (payload?.status) updateSteps(payload.status);
  if (typeof payload?.etaMin === 'number'){ state.etaMin = payload.etaMin; renderHeader(); }

  const latlng = [payload.lat, payload.lng];
  if (Number.isFinite(latlng[0]) && Number.isFinite(latlng[1])){
    courierMarker.setLatLng(latlng);
    extendRoute(latlng);
  }
}

function extendRoute(latlng){
  const pts = routeLine.getLatLngs();
  const last = pts[pts.length-1];
  if (!last || last.lat !== latlng[0] || last.lng !== latlng[1]){
    routeLine.addLatLng(latlng);
    bounds = bounds ? bounds.extend(latlng) : L.latLngBounds(latlng, latlng);
  }
}

function simulate(){
  if (simTimer) clearInterval(simTimer);
  const pk = state.order?.pickup  || { lat: -23.556, lng: -46.662 };
  const dp = state.order?.dropoff || { lat: -23.559, lng: -46.642 };
  let t = 0;
  const path = interpolate(pk, dp, 120);
  simTimer = setInterval(()=>{
    const p = path[t];
    if (!p){
      clearInterval(simTimer);
      onRealtime({ status:'DELIVERED', etaMin:0, lat:dp.lat, lng:dp.lng });
      return;
    }
    if (t === 1)  onRealtime({ status:'PREPARING',        etaMin: 14, lat:p.lat, lng:p.lng });
    if (t === 30) onRealtime({ status:'PICKED_UP',         etaMin: 12, lat:p.lat, lng:p.lng });
    if (t === 40) onRealtime({ status:'OUT_FOR_DELIVERY',  etaMin: 10, lat:p.lat, lng:p.lng });
    onRealtime({ lat:p.lat, lng:p.lng, etaMin: Math.max(1, Math.round((path.length - t)/12)) });
    t++;
  }, 1000);
}

function wireRealtimeOrSim(){
  if (window.MR_REALTIME?.subscribe && state.order?.id){
    window.MR_REALTIME.subscribe(state.order.id, onRealtime);
  } else {
    simulate();
  }
}

function interpolate(a, b, steps){
  const out = [];
  for (let i=0; i<=steps; i++){
    const r = i/steps;
    out.push({ lat: a.lat + (b.lat-a.lat)*r, lng: a.lng + (b.lng-a.lng)*r });
  }
  return out;
}

/* ---------- Carregar um pedido por código ---------- */
async function fetchOrderByCode(code){
  const norm = code.trim().toUpperCase();
  // 1) Serviço oficial
  if (window.MR_ORDERS?.getById){
    try{
      const o = await window.MR_ORDERS.getById(norm);
      if (o) return o;
    }catch{}
  }
  // 2) Último pedido salvo localmente
  try{
    const last = JSON.parse(localStorage.getItem('mr_last_order')||'null');
    if (last?.id?.toUpperCase() === norm) return last;
  }catch{}
  // 3) Demonstração
  if (norm === 'MR-DEMO') return getLastOrder();
  return null;
}

/* ---------- Aplicar um novo pedido no mapa/UI ---------- */
function loadOrder(order){
  state.order = order;
  state.status = 'PLACED';
  state.etaMin = undefined;

  // inputs
  if ($trackCode) $trackCode.value = order.id || '';
  if ($trackProd){ $trackProd.value = ''; renderProductInfo(''); }

  // mapa
  resetDynamicRoute();
  drawStaticMarkersAndPlannedRoute();
  fitAll();

  // ui
  if ($orderId) $orderId.textContent = `Pedido — ${state.order?.id || '—'}`;
  buildSteps();          // re-render steps (limpa estados)
  renderHeader();

  // realtime/sim
  wireRealtimeOrSim();
}

/* ---------- Pedido atual (sem redirect) ---------- */
function getLastOrder(){
  if (window.MR_ORDERS?.getLast){
    try{ return window.MR_ORDERS.getLast(); }catch{}
  }
  try{
    const o = JSON.parse(localStorage.getItem('mr_last_order')||'null');
    if (o) return o;
  }catch{}
  // Fallback demo
  return {
    id: 'MR-DEMO',
    pickup:  { lat:-23.556, lng:-46.662, name:'Moto Rotas Loja' },
    dropoff: { lat:-23.559, lng:-46.642, name:'Cliente' },
    items:   [{ name:'Combo Burger', qty:1, price:28.9 }],
    payment: { method:'pix' },
    courier: { name:'João', phone:'5511999999999' }
  };
}

/* ---------- util ---------- */
function flash(text){
  const el = document.createElement('div');
  el.className = 'toast toast--show';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(()=> el.classList.remove('toast--show'), 1800);
  setTimeout(()=> el.remove(), 2200);
}
function blinkTimeline(){
  const tl = document.getElementById('timeline');
  if (!tl) return;
  tl.classList.add('blink');
  setTimeout(()=> tl.classList.remove('blink'), 700);
}
