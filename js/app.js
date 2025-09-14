/* app.js — tema, sidebar, autocomplete, painel de status e mapa (Leaflet) com init robusto */
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

  // ---------- Sidebar (mobile): abrir/fechar ----------
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

  const mqDesktop = window.matchMedia('(min-width: 961px)');
  mqDesktop.addEventListener?.('change', (ev) => {
    if (ev.matches) sidebar?.classList.remove('is-open');
    if (window.__invalidateMap__) setTimeout(()=>window.__invalidateMap__(), 60);
  });

  // ---------- navegação: estado ativo ----------
  on(document, 'click', '.nav__item', (_e, btn) => {
    $$('.nav__item').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    btn.setAttribute('aria-current', 'page');
  });

  // ---------- tema claro/escuro ----------
  const root = document.documentElement;
  const themeBtn = $('#themeToggle');
  const THEME_KEY = 'mr_theme';

  const applyTheme = (theme) => {
    root.setAttribute('data-bs-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
    if (window.__setMapTheme__) window.__setMapTheme__(theme);
  };

  applyTheme(localStorage.getItem(THEME_KEY) || root.getAttribute('data-bs-theme') || 'dark');

  themeBtn?.addEventListener('click', () => {
    const next = root.getAttribute('data-bs-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
  });
  themeBtn?.querySelector('.theme-switch__knob')?.addEventListener('click', (e) => {
    e.stopPropagation();
    themeBtn.click();
  });

  // ---------- autocomplete (mock) ----------
  const input = $('#searchInput');
  const list  = $('#searchSuggest');
  const SUGGESTIONS = [
    {label: 'São Paulo, SP', lat:-23.5505, lng:-46.6333},
    {label: 'Rio de Janeiro, RJ', lat:-22.9068, lng:-43.1729},
    {label: 'Belo Horizonte, MG', lat:-19.9167, lng:-43.9345},
    {label: 'Avenida Paulista', lat:-23.5614, lng:-46.6557},
    {label: 'Rua XV de Novembro, Curitiba', lat:-25.4284, lng:-49.2733},
  ];

  const updateSuggestions = (value) => {
    const v = (value || '').trim().toLowerCase();
    if (!v) { list?.classList.remove('is-open'); if (list) list.innerHTML=''; return; }
    const items = SUGGESTIONS.filter(s => s.label.toLowerCase().includes(v)).slice(0,8);
    if (!items.length) { list?.classList.remove('is-open'); if (list) list.innerHTML=''; return; }
    if (list) {
      list.innerHTML = items.map((s,i)=>`<li role="option" data-i="${i}">${s.label}</li>`).join('');
      list.classList.add('is-open');
    }
  };

  input?.addEventListener('input', e => updateSuggestions(e.target.value));
  list?.addEventListener('click', e => {
    const li = e.target.closest('li'); if (!li) return;
    const { i } = li.dataset; const s = SUGGESTIONS[Number(i)];
    if (!s) return;
    if (input) input.value = s.label;
    list.classList.remove('is-open'); list.innerHTML='';
    if (map?.flyTo) map.flyTo([s.lat, s.lng], 13, {duration: .6});
  });

// ----- Status: FAB + abrir/fechar + persistência -----
const statusBtn   = $('#statusToggle');
const statusPanel = $('#statusPanel');
const STATUS_KEY  = 'mr_status_open';

function openStatus(){
  statusPanel?.classList.remove('is-collapsed');
  statusBtn?.setAttribute('aria-expanded','true');
  try { localStorage.setItem(STATUS_KEY, '1'); } catch {}
  if (window.__invalidateMap__) setTimeout(()=>window.__invalidateMap__(), 60);
}
function closeStatus(){
  statusPanel?.classList.add('is-collapsed');
  statusBtn?.setAttribute('aria-expanded','false');
  try { localStorage.setItem(STATUS_KEY, '0'); } catch {}
  if (window.__invalidateMap__) setTimeout(()=>window.__invalidateMap__(), 60);
}

statusBtn?.addEventListener('click', ()=>{
  if (!statusPanel) return;
  statusPanel.classList.contains('is-collapsed') ? openStatus() : closeStatus();
});

// inicialização: SEMPRE fechado, a não ser que o usuário tenha salvo “aberto”
(() => {
  const saved = (()=>{ try { return localStorage.getItem(STATUS_KEY); } catch { return null; } })();
  if (saved === '1') openStatus(); else closeStatus();
})();

// em mudanças de breakpoint NÃO forçamos abrir/fechar; só recalcula o mapa
const mqStatus = window.matchMedia('(min-width: 961px)');
mqStatus.addEventListener?.('change', () => {
  if (window.__invalidateMap__) setTimeout(()=>window.__invalidateMap__(), 60);
});


  // dados mock
  const orders = [
    { id:1243, cliente:'Alexandre',  entregador:'Lula',   status:'late', avatar:'assets/Alexandre.jpg' },
    { id:1244, cliente:'Maria Souza',entregador:'Thiago', status:'done', avatar:'assets/Thiago.jpg' },
    { id:1245, cliente:'Ana Lima',   entregador:'Pedro',  status:'on',   avatar:'assets/Pedro.jpg' },
  ];

  const listEl   = $('#ordersList');
  const kpiLate  = $('#kpiLate');
  const kpiDone  = $('#kpiDone');
  const kpiOn    = $('#kpiOn');

  let currentFilter = 'all';

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
  function renderList(){
    if (!listEl) return;
    listEl.innerHTML = '';
    const data = currentFilter === 'all' ? orders : orders.filter(o=>o.status===currentFilter);
    data.forEach(o=>{
      const li = document.createElement('li');
      li.className = classByStatus(o.status);
      li.innerHTML = `
        <div class="card__title">Pedido #${o.id} — ${o.cliente}</div>
        <div class="card__meta">Entregador: ${o.entregador}</div>
        <img class="card__avatar" alt="Foto de ${o.entregador}" src="${o.avatar || 'assets/user.jpg'}">
      `;
      listEl.appendChild(li);
    });
  }
  renderKPIs();
  renderList();

  // filtros (pílulas .pill dentro do aside.status)
  $$('.status .pill').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.status .pill').forEach(b=>b.classList.remove('is-active'));
      btn.classList.add('is-active');
      currentFilter = btn.dataset.filter || 'all';
      renderList();
    });
  });

  // ---------- MAPA (Leaflet) — init robusto ----------
  const mapEl = $('#map');
  let map, darkTiles, lightTiles, currentTiles;

  window.__setMapTheme__ = (theme) => {
    if (!map || !darkTiles || !lightTiles) return;
    const newTiles = theme === 'light' ? lightTiles : darkTiles;
    if (currentTiles) map.removeLayer(currentTiles);
    newTiles.addTo(map);
    currentTiles = newTiles;
    setTimeout(() => map.invalidateSize(), 120);
  };
  window.__invalidateMap__ = () => { try { map?.invalidateSize(); } catch (_) {} };

  const createMapIfReady = () => {
    if (!mapEl) return;
    const w = mapEl.offsetWidth;
    const h = mapEl.offsetHeight;
    if (w < 100 || h < 100) return;

    if (typeof L === 'undefined') {
      console.error('[MAPA] Leaflet não carregou. Verifique o <script src="https://unpkg.com/leaflet...">');
      return;
    }
    if (map) return;

    map = L.map(mapEl, { center:[-23.55,-46.63], zoom:12, zoomControl:true });

    darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:'© OpenStreetMap, © CARTO'
    });
    lightTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:'© OpenStreetMap, © CARTO'
    });

    const initialTheme = root.getAttribute('data-bs-theme') === 'light' ? 'light' : 'dark';
    currentTiles = initialTheme === 'light' ? lightTiles : darkTiles;
    currentTiles.addTo(map);

    setTimeout(()=> map.invalidateSize(), 0);

    // POIs exemplo
    const restaurants = [
      {name:'Restaurante Natsu', lat:-23.561, lng:-46.657},
      {name:'Cantina da Praça', lat:-23.559, lng:-46.635},
    ];
    const hospitals = [{name:'Hospital Central', lat:-23.553, lng:-46.645}];
    const traffic = [
      {name:'Semáforo 1', lat:-23.552, lng:-46.632},
      {name:'Semáforo 2', lat:-23.566, lng:-46.641},
    ];

    const restGroup = L.layerGroup(restaurants.map(p=>L.marker([p.lat,p.lng]).bindPopup(`🍽️ ${p.name}`)));
    const hospGroup = L.layerGroup(hospitals.map(p=>L.marker([p.lat,p.lng]).bindPopup(`🏥 ${p.name}`)));
    const trafGroup = L.layerGroup(traffic.map(p=>L.marker([p.lat,p.lng]).bindPopup(`🚦 ${p.name}`)));

    restGroup.addTo(map); hospGroup.addTo(map); trafGroup.addTo(map);
    L.control.layers(null, {
      'Restaurantes': restGroup,
      'Hospitais': hospGroup,
      'Semáforos': trafGroup
    }, {collapsed:true}).addTo(map);

    console.log('[MAPA] Inicializado com', w, 'x', h);
  };

  createMapIfReady();

  if (mapEl && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(() => createMapIfReady());
    ro.observe(mapEl);
  }

  window.addEventListener('load', () => {
    if (!map && mapEl) {
      root.setAttribute('data-debug-map', '1');
      setTimeout(createMapIfReady, 100);
    }
  });

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
