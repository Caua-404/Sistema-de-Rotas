/* app.js — tema, sidebar, autocomplete, painel de status, mapa (Leaflet) e Waze embed + simulação de rotas */
document.addEventListener('DOMContentLoaded', () => {
  // ---------- helpers ----------
  const $  = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const on = (el, ev, selOrFn, fn) => {
    if (typeof selOrFn === 'function') { el.addEventListener(ev, selOrFn); return; }
    el.addEventListener(ev, e => {
      const t = e.target.closest(selOrFn);
      if (t && el.contains(t)) fn(e, t);
    });
  };

  // ---------- Sidebar (mobile) ----------
  const btnOpen  = $('#btnOpenSidebar');
  const sidebar  = $('.sidebar');
  btnOpen?.addEventListener('click', () => sidebar?.classList.add('is-open'));
  document.addEventListener('pointerdown', (e) => {
    if (!sidebar || !sidebar.classList.contains('is-open')) return;
    const isInside  = sidebar.contains(e.target);
    const isOpenBtn = btnOpen?.contains(e.target);
    if (!isInside && !isOpenBtn) sidebar.classList.remove('is-open');
  });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') sidebar?.classList.remove('is-open'); });

  // ---------- Navegação ativa ----------
  on(document, 'click', '.nav__item', (_e, btn) => {
    $$('.nav__item').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    btn.setAttribute('aria-current', 'page');
  });

  // ---------- Tema ----------
  const root = document.documentElement;
  const themeBtn = $('#themeToggle');
  const THEME_KEY = 'mr_theme';
  const applyTheme = (theme) => {
    root.setAttribute('data-bs-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
    if (window.__setMapTheme__) window.__setMapTheme__(theme);
  };
  applyTheme(localStorage.getItem(THEME_KEY) || root.getAttribute('data-bs-theme') || 'dark');
  themeBtn?.addEventListener('click', () => {
    const next = root.getAttribute('data-bs-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
  });
  themeBtn?.querySelector('.theme-switch__knob')?.addEventListener('click', (e) => {
    e.stopPropagation(); themeBtn.click();
  });

  // ---------- Autocomplete (mock) ----------
  const input = $('#searchInput');
  const list  = $('#searchSuggest');
  const SUGGESTIONS = [
    {label: 'São Paulo, SP', lat:-23.5505, lng:-46.6333},
    {label: 'Rio de Janeiro, RJ', lat:-22.9068, lng:-43.1729},
    {label: 'Belo Horizonte, MG', lat:-19.9167, lng:-43.9345},
    {label: 'Avenida Paulista', lat:-23.5614, lng:-46.6557},
    {label: 'Rua XV de Novembro, Curitiba', lat:-25.4284, lng:-49.2733},
  ];
  function updateSuggestions(value){
    const v = (value || '').trim().toLowerCase();
    if (!v){ list?.classList.remove('is-open'); if (list) list.innerHTML=''; return; }
    const items = SUGGESTIONS.filter(s => s.label.toLowerCase().includes(v)).slice(0,8);
    if (!items.length){ list?.classList.remove('is-open'); if (list) list.innerHTML=''; return; }
    if (list){
      list.innerHTML = items.map((s,i)=>`<li role="option" data-i="${i}">${s.label}</li>`).join('');
      list.classList.add('is-open');
    }
  }
  input?.addEventListener('input', e => updateSuggestions(e.target.value));
  list?.addEventListener('click', e => {
    const li = e.target.closest('li'); if (!li) return;
    const { i } = li.dataset; const s = SUGGESTIONS[Number(i)];
    if (!s) return;
    if (input) input.value = s.label;
    list.classList.remove('is-open'); list.innerHTML='';
    if (map?.flyTo) map.flyTo([s.lat, s.lng], 13, {duration: .6});
  });

  // ---------- Painel de Status (toggle com persistência) ----------
  const statusBtn   = $('#statusToggle');
  const statusPanel = $('#statusPanel');
  const STATUS_KEY  = 'mr_status_open';
  function openStatus(){ statusPanel?.classList.remove('is-collapsed'); statusBtn?.setAttribute('aria-expanded','true'); try{localStorage.setItem(STATUS_KEY,'1');}catch{}; if (window.__invalidateMap__) setTimeout(()=>window.__invalidateMap__(), 60); }
  function closeStatus(){ statusPanel?.classList.add('is-collapsed');    statusBtn?.setAttribute('aria-expanded','false'); try{localStorage.setItem(STATUS_KEY,'0');}catch{}; if (window.__invalidateMap__) setTimeout(()=>window.__invalidateMap__(), 60); }
  statusBtn?.addEventListener('click', ()=>{ if (!statusPanel) return; statusPanel.classList.contains('is-collapsed') ? openStatus() : closeStatus(); });
  (()=>{ const saved = (()=>{try{return localStorage.getItem(STATUS_KEY);}catch{return null;}})(); saved==='1'?openStatus():closeStatus(); })();

  // ---------- Dados de entregas + coordenadas destino (mock) ----------
  const orders = [
    // status: late (vermelho) | done (verde) | on (amarelo)
    { id:1243, cliente:'Alexandre',  entregadorId:1, entregador:'Lula',   status:'late', dest:{lat:-23.5610, lng:-46.6557}, avatar:'assets/Alexandre.jpg' },
    { id:1244, cliente:'Maria Souza',entregadorId:2, entregador:'Thiago', status:'done', dest:{lat:-23.5535, lng:-46.6450}, avatar:'assets/Thiago.jpg' },
    { id:1245, cliente:'Ana Lima',   entregadorId:3, entregador:'Pedro',  status:'on',   dest:{lat:-23.5660, lng:-46.6410}, avatar:'assets/Pedro.jpg' },
  ];
  // couriers com posição atual
  const couriers = [
    { id:1, name:'Lula',   lat:-23.5630, lng:-46.6600 },
    { id:2, name:'Thiago', lat:-23.5510, lng:-46.6400 },
    { id:3, name:'Pedro',  lat:-23.5670, lng:-46.6480 },
  ];

  const listEl   = $('#ordersList');
  const kpiLate  = $('#kpiLate');
  const kpiDone  = $('#kpiDone');
  const kpiOn    = $('#kpiOn');

  function renderKPIs(){
    const late = orders.filter(o=>o.status==='late').length;
    const done = orders.filter(o=>o.status==='done').length;
    const on   = orders.filter(o=>o.status==='on').length;
    if (kpiLate) kpiLate.textContent = String(late).padStart(2,'0');
    if (kpiDone) kpiDone.textContent = String(done).padStart(2,'0');
    if (kpiOn)   kpiOn.textContent   = String(on).padStart(2,'0');
  }
  function classByStatus(s){
    if (s === 'done') return 'card card--done';  // verde
    if (s === 'late') return 'card card--late';  // vermelho
    if (s === 'on')   return 'card card--on';    // amarelo
    return 'card';
  }
  function renderList(filter='all'){
    if (!listEl) return;
    listEl.innerHTML = '';
    const data = filter==='all' ? orders : orders.filter(o=>o.status===filter);
    data.forEach(o=>{
      const li = document.createElement('li');
      li.className = classByStatus(o.status);
      li.dataset.orderId = o.id;
      li.innerHTML = `
        <div class="card__title">Pedido #${o.id} — ${o.cliente}</div>
        <div class="card__meta">Entregador: ${o.entregador}</div>
        <img class="card__avatar" alt="Foto de ${o.entregador}" src="${o.avatar || 'assets/user.jpg'}">
      `;
      listEl.appendChild(li);
    });
  }
  renderKPIs();
  let currentFilter = 'all';
  renderList(currentFilter);

  // filtros
  const legend = $('.status__legend');
  legend?.addEventListener('click', (e)=>{
    const btn = e.target.closest('.pill'); if(!btn) return;
    legend.querySelectorAll('.pill').forEach(b=>b.classList.remove('is-active'));
    btn.classList.add('is-active');
    currentFilter = btn.dataset.filter || 'all';
    renderList(currentFilter);
  });

  // ========= Mapa: Leaflet + Waze =========
  const mapEl = $('#map');
  const wazeWrap  = $('#wazeWrap');
  const wazeFrame = $('#wazeFrame');
  const btnLeaflet= $('#btnProviderLeaflet');
  const btnWaze   = $('#btnProviderWaze');

  let map, darkTiles, lightTiles, currentTiles, routingCtl, movingMarker;

  // Troca visual do provider
  function setProviderUI(provider){
    if (provider === 'waze'){
      btnWaze?.classList.add('is-active'); btnLeaflet?.classList.remove('is-active');
      wazeWrap?.removeAttribute('hidden'); mapEl?.setAttribute('hidden','');
    } else {
      btnLeaflet?.classList.add('is-active'); btnWaze?.classList.remove('is-active');
      mapEl?.removeAttribute('hidden'); wazeWrap?.setAttribute('hidden','');
      setTimeout(()=>window.__invalidateMap__ && window.__invalidateMap__(), 60);
    }
  }

  // ===== Waze embed =====
  function showWazeRoute(from, to, zoom=13){
    if (!wazeFrame) return;
    const params = new URLSearchParams({
      zoom: String(zoom),
      lat: String(to.lat),
      lon: String(to.lng),
      from_lat: String(from.lat),
      from_lon: String(from.lng),
      to_lat: String(to.lat),
      to_lon: String(to.lng),
      pin: '1'
    });
    wazeFrame.src = `https://embed.waze.com/iframe?${params.toString()}`;
  }

  // ===== Leaflet init =====
  window.__setMapTheme__ = (theme) => {
    if (!map || !darkTiles || !lightTiles) return;
    const newTiles = theme === 'light' ? lightTiles : darkTiles;
    if (currentTiles) map.removeLayer(currentTiles);
    newTiles.addTo(map);
    currentTiles = newTiles;
    setTimeout(() => map.invalidateSize(), 120);
  };
  window.__invalidateMap__ = () => { try { map?.invalidateSize(); } catch {} };

  function createMapIfReady(){
    if (!mapEl) return;
    const w = mapEl.offsetWidth, h = mapEl.offsetHeight;
    if (w < 100 || h < 100) return;
    if (typeof L === 'undefined') { console.error('Leaflet não carregou'); return; }
    if (map) return;

    map = L.map(mapEl, { center:[-23.55,-46.63], zoom:12, zoomControl:true });

    darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution:'© OpenStreetMap, © CARTO' });
    lightTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution:'© OpenStreetMap, © CARTO' });

    const initialTheme = root.getAttribute('data-bs-theme') === 'light' ? 'light' : 'dark';
    currentTiles = initialTheme === 'light' ? lightTiles : darkTiles;
    currentTiles.addTo(map);

    setTimeout(()=> map.invalidateSize(), 0);
  }
  createMapIfReady();
  if (mapEl && 'ResizeObserver' in window) new ResizeObserver(()=>createMapIfReady()).observe(mapEl);
  window.addEventListener('load', ()=>{ if (!map && mapEl) { root.setAttribute('data-debug-map','1'); setTimeout(createMapIfReady,100); } });

  // ===== Leaflet: simulação de rota (OSRM demo) =====
  function clearRoute(){
    if (routingCtl){ map.removeControl(routingCtl); routingCtl = null; }
    if (movingMarker){ map.removeLayer(movingMarker); movingMarker = null; }
  }
  function simulateLeafletRoute(from, to){
    if (!map || !L.Routing) return;
    clearRoute();
    routingCtl = L.Routing.control({
      waypoints: [ L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng) ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      show: false,
      collapsible: true,
      fitSelectedRoutes: true,
      lineOptions: { addWaypoints:false, styles:[{color:'#ff5900', weight:6, opacity:0.9}] },
      router: L.Routing.osrmv1({ serviceUrl:'https://router.project-osrm.org/route/v1' })
    }).addTo(map);

    routingCtl.on('routesfound', (e)=>{
      const line = L.polyline(e.routes[0].coordinates, {opacity:0});
      movingMarker = L.marker(e.routes[0].coordinates[0]).addTo(map);

      const coords = e.routes[0].coordinates;
      let i = 0;
      const tick = () => {
        if (!movingMarker) return;
        movingMarker.setLatLng(coords[i]);
        i = (i+1 < coords.length) ? i+1 : i;
        if (i < coords.length-1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  // ===== UI: trocar provedor =====
  btnLeaflet?.addEventListener('click', ()=> setProviderUI('leaflet'));
  btnWaze?.addEventListener('click',    ()=> setProviderUI('waze'));

  // ===== Ao clicar num card, traça a rota (no provedor atual) =====
  listEl?.addEventListener('click', (e)=>{
    const li = e.target.closest('li[data-order-id]'); if (!li) return;
    const id = Number(li.dataset.orderId);
    const order = orders.find(o=>o.id===id); if (!order) return;
    const courier = couriers.find(c=>c.id===order.entregadorId); if (!courier) return;

    // provider atual?
    const usingWaze = !wazeWrap?.hasAttribute('hidden');
    if (usingWaze){
      showWazeRoute({lat:courier.lat, lng:courier.lng}, order.dest, 14);
    } else {
      simulateLeafletRoute({lat:courier.lat, lng:courier.lng}, order.dest);
    }
  });

  // Inicia no Leaflet
  setProviderUI('leaflet');

  // ---------- Saudação ----------
  (function hydrateUser(){
    try {
      const data = JSON.parse(sessionStorage.getItem('mr_auth') || 'null');
      const name = data?.user || 'Visitante';
      const greetSpan = $('#greetName');
      if (greetSpan) greetSpan.textContent = name;
    } catch {
      const greetSpan = $('#greetName');
      if (greetSpan) greetSpan.textContent = 'Visitante';
    }
  })();
});
