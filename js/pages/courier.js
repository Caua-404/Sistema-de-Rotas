// ===== PWA Motoboy — convites com countdown, swipe, vibração, notificação =====
const $queue = document.getElementById('queue');
const $toggle = document.getElementById('toggle-online');

let state = {
  online: loadOnline(),
  jobs: [],          // convites pendentes
  timers: {},        // id -> interval
};

// boot
document.addEventListener('DOMContentLoaded', () => {
  // estado inicial do toggle
  if ($toggle) $toggle.checked = state.online;
  wireToggle();
  renderSkeleton();   // mostra shimmer
  subscribeOrSim();   // conecta realtime ou simulação
});

// ===== Toggle online/offline =====
function wireToggle(){
  $toggle?.addEventListener('change', async (e)=>{
    state.online = !!e.target.checked;
    saveOnline(state.online);
    flash(state.online ? 'Você está em turno' : 'Você saiu do turno');

    // notificações (uma vez)
    if (state.online && 'Notification' in window && Notification.permission === 'default'){
      try{ await Notification.requestPermission(); }catch{}
    }
    // (des)inscreve
    subscribeOrSim();
  });
}

function loadOnline(){
  try{ return JSON.parse(localStorage.getItem('mr_courier_online')||'true'); }catch{ return true; }
}
function saveOnline(v){
  try{ localStorage.setItem('mr_courier_online', JSON.stringify(!!v)); }catch{}
}

// ===== Realtime ou fallback de simulação =====
function subscribeOrSim(){
  clearAllTimers();
  state.jobs = [];
  render();

  if (!state.online){
    return; // em turno off => não recebe convites
  }

  if (window.MR_REALTIME?.subscribeCourier){
    // backend real
    window.MR_REALTIME.subscribeCourier(onInvite, onInviteRemove);
  }else{
    // simulação local
    simulateInvites();
  }
}

function onInvite(job){
  upsertJob(job);
  notifyNew(job);
  vibrate([60, 40, 60]);
}
function onInviteRemove(jobId){
  removeJob(jobId);
}

function upsertJob(job){
  const existing = state.jobs.find(j => j.id === job.id);
  if (existing){
    Object.assign(existing, job);
  }else{
    state.jobs.unshift(job);
    startCountdown(job);
  }
  render();
}

function removeJob(id){
  state.jobs = state.jobs.filter(j => j.id !== id);
  stopCountdown(id);
  render();
}

// ===== Countdown =====
function startCountdown(job){
  // job.expiresAt (timestamp ms). se não vier, 35s padrão
  const ttl = (job.expiresAt && job.expiresAt - Date.now()) || 35000;
  job.expiresAt = Date.now() + ttl;

  updateTimerBar(job);
  state.timers[job.id] = setInterval(()=>{
    updateTimerBar(job);
    if (Date.now() >= job.expiresAt){
      // expirou
      stopCountdown(job.id);
      removeJob(job.id);
      vibrate([80, 40, 80, 40, 80]);
      flash('Convite expirou');
    }
  }, 250);
}

function stopCountdown(id){
  const t = state.timers[id];
  if (t){ clearInterval(t); delete state.timers[id]; }
}

function clearAllTimers(){
  Object.keys(state.timers).forEach(stopCountdown);
}

function updateTimerBar(job){
  const el = document.querySelector(`[data-id="${job.id}"] .job__timer`);
  if (!el) return;
  const total = (job.expiresAt - (job.createdAt || (job.expiresAt - 35000)));
  const left  = job.expiresAt - Date.now();
  const pct = Math.max(0, Math.min(1, left / total));
  el.style.background = `linear-gradient(90deg, var(--primary) ${pct*100}%, transparent ${pct*100}%)`;
  const card = el.closest('.job');
  card.classList.toggle('is-expiring', pct < .25);
}

// ===== Render =====
function render(){
  if (!$queue) return;
  if (!state.jobs.length){
    $queue.innerHTML = `
      <div class="cardX" style="text-align:center">
        Sem convites no momento.
      </div>`;
    return;
  }
  $queue.innerHTML = state.jobs.map(jobTpl).join('');
  wireActions();
  wireSwipe();
}

function renderSkeleton(){
  if (!$queue) return;
  $queue.innerHTML = `
    <article class="job skeleton">
      <div class="job__timer"></div>
      <div class="shimmer"></div>
    </article>`;
}

function jobTpl(job){
  const dist = job.distanceKm != null ? `${job.distanceKm.toFixed(1)} km` : '—';
  const payout = job.payout != null ? `R$ ${job.payout.toFixed(2)}` : '—';
  const eta = job.etaMin != null ? `${job.etaMin} min` : '—';
  const itemsText = (job.items && job.items.length)
    ? job.items.map(i => `${i.qty||1}× ${i.name||i.title}`).join(' • ')
    : (job.note || 'Itens do pedido');

  return `
  <article class="job" data-id="${job.id}">
    <div class="job__timer"></div>
    <div class="job__body">
      <div class="job__head">
        <div class="job__title">${job.store?.name || 'Restaurante'}</div>
        <span class="job__pill">Novo</span>
      </div>

      <div class="job__meta">
        <span>📍 <b>${job.store?.addr || 'Endereço da loja'}</b></span>
        <span>🧭 ${dist}</span>
        <span>⏱️ ${eta}</span>
        <span>💸 ${payout}</span>
      </div>

      <div class="job__items">${itemsText}</div>
    </div>

    <div class="job__actions">
      <button class="btnX btnX--ghost" data-action="decline" data-id="${job.id}">Recusar</button>
      <button class="btnX btnX--primary" data-action="accept"  data-id="${job.id}">Aceitar</button>
    </div>
  </article>`;
}

function wireActions(){
  $queue.querySelectorAll('[data-action="accept"]').forEach(btn=>{
    btn.addEventListener('click', ()=> acceptJob(btn.dataset.id));
  });
  $queue.querySelectorAll('[data-action="decline"]').forEach(btn=>{
    btn.addEventListener('click', ()=> declineJob(btn.dataset.id));
  });
}

async function acceptJob(id){
  const job = state.jobs.find(j => j.id === id);
  if (!job) return;

  markSwipeVisual(id, 'is-accept');
  stopCountdown(id);

  let ok = false;
  if (window.MR_REALTIME?.acceptInvite){
    try{ ok = await window.MR_REALTIME.acceptInvite(id); }catch{}
  }
  if (!ok && window.MR_ORDERS?.assignToCourier){
    try{ ok = await window.MR_ORDERS.assignToCourier(id); }catch{}
  }

  removeJob(id);
  vibrate([40, 60, 120]);
  flash('Convite aceito');

  // navega para o tracking com o código do pedido (se disponível)
  const code = job.orderId || job.id;
  if (code) {
    try {
      localStorage.setItem('mr_last_order', JSON.stringify(makeOrderFromInvite(job)));
    } catch {}
    window.location.href = `track.html`;
  }
}

async function declineJob(id){
  markSwipeVisual(id, 'is-decline');
  stopCountdown(id);

  if (window.MR_REALTIME?.declineInvite){
    try{ await window.MR_REALTIME.declineInvite(id); }catch{}
  }
  removeJob(id);
  vibrate(60);
  flash('Convite recusado');
}

function markSwipeVisual(id, cls){
  const card = document.querySelector(`[data-id="${id}"]`);
  if (card){ card.classList.add(cls); setTimeout(()=> card.classList.remove(cls), 400); }
}

/* ===== Swipe ===== */
function wireSwipe(){
  const cards = $queue.querySelectorAll('.job');
  cards.forEach(card=>{
    let startX = 0, dx = 0, isDown = false;

    const onDown = (e)=>{
      isDown = true; dx = 0;
      startX = (e.touches ? e.touches[0].clientX : e.clientX);
      card.classList.add('swiping');
    };
    const onMove = (e)=>{
      if (!isDown) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      dx = x - startX;
      card.style.transform = `translateX(${dx}px)`;
      card.classList.toggle('swipe-right', dx > 40);
      card.classList.toggle('swipe-left',  dx < -40);
    };
    const onUp = ()=>{
      if (!isDown) return;
      card.classList.remove('swiping', 'swipe-right', 'swipe-left');
      card.style.transform = '';
      const id = card.dataset.id;
      if (dx > 90) acceptJob(id);
      else if (dx < -90) declineJob(id);
      isDown = false; dx = 0;
    };

    card.addEventListener('pointerdown', onDown);
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerup', onUp);
    card.addEventListener('pointercancel', onUp);
    // touch
    card.addEventListener('touchstart', onDown, {passive:true});
    card.addEventListener('touchmove', onMove, {passive:true});
    card.addEventListener('touchend', onUp);
  });
}

/* ===== Notificação/Vibração util ===== */
function notifyNew(job){
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try{
    new Notification('Novo convite', {
      body: `${job.store?.name||'Restaurante'} • ${job.payout ? 'R$ '+job.payout.toFixed(2) : ''}`.trim(),
    });
  }catch{}
}
function vibrate(pattern){
  try{ if (navigator.vibrate) navigator.vibrate(pattern); }catch{}
}
function flash(text){
  const el = document.createElement('div');
  el.className = 'toast toast--show';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(()=> el.classList.remove('toast--show'), 1600);
  setTimeout(()=> el.remove(), 2000);
}

/* ===== Simulação (quando backend ausente) ===== */
function simulateInvites(){
  // gera um convite inicial
  setTimeout(()=> onInvite(fakeInvite()), 600);

  // depois gera aleatoriamente
  let n = 2;
  const loop = setInterval(()=>{
    if (!state.online) { clearInterval(loop); return; }
    onInvite(fakeInvite(n++));
  }, 18000);
}

function fakeInvite(n=1){
  const now = Date.now();
  return {
    id: 'SIM-' + now + '-' + n,
    orderId: 'MR-DEMO',
    createdAt: now,
    expiresAt: now + 35000,
    distanceKm: (Math.random()*4 + 0.8),
    payout: (Math.random()*9 + 5),
    etaMin: Math.round(Math.random()*10 + 10),
    store: { name: ['Lanche 10','Pizzaria da Vila','Sushi GO','Padaria Central'][Math.floor(Math.random()*4)],
             addr: 'Rua Exemplo, 123' },
    items: [{ qty:1, name:'Pedido variado' }]
  };
}

function makeOrderFromInvite(inv){
  // ordem básica para o track.html
  return {
    id: inv.orderId || inv.id,
    pickup:  { lat: -23.556, lng: -46.662, name: inv.store?.name || 'Loja' },
    dropoff: { lat: -23.559, lng: -46.642, name: 'Cliente' },
    items:   inv.items || [{ name:'Pedido', qty:1, price: inv.payout||0 }],
    payment: { method: 'pix' },
    courier: { name: 'Você' }
  };
}
