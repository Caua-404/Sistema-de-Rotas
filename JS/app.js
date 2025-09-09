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

  // ---------- sidebar (mobile) ----------
  const sidebar = $('.sidebar');
  const btnOpen = $('#btnOpenSidebar');
  const btnClose = $('#btnCloseSidebar'); // pode não existir

  btnOpen?.addEventListener('click', () => sidebar?.classList.add('is-open'));
  btnClose?.addEventListener('click', () => sidebar?.classList.remove('is-open'));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') sidebar?.classList.remove('is-open');
  });

  document.addEventListener('pointerdown', (e) => {
    if (!sidebar || !sidebar.classList.contains('is-open')) return;
    const isInside = sidebar.contains(e.target);
    const isOpenBtn = btnOpen?.contains(e.target);
    if (!isInside && !isOpenBtn) sidebar.classList.remove('is-open');
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
    // sincroniza mapa (se já existir)
    if (window.__setMapTheme__) window.__setMapTheme__(theme);
  };

  applyTheme(localStorage.getItem(THEME_KEY) || root.getAttribute('data-bs-theme') || 'dark');

  themeBtn?.addEventListener('click', () => {
    const next = root.getAttribute('data-bs-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
  });
  // knob interno também alterna
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

  // ---------- KPI + cards (mock) ----------
  const orders = [
    { id:1243, cliente:'Alexandre',    entregador:'Lula',   status:'late' },
    { id:1244, cliente:'Maria Souza',  entregador:'Thiago', status:'done' },
    { id:1245, cliente:'Ana Lima',     entregador:'Pedro',  status:'on'   },
  ];
  const ul = $('#ordersList');
  const kpiLate = $('#kpiLate');
  const kpiDone = $('#kpiDone');
  const kpiOn   = $('#kpiOn');

  const renderOrders = (listData) => {
    if (!ul) return;
    ul.innerHTML=''; let late=0, done=0, on=0;
    listData.forEach(o=>{
      const li = document.createElement('li');
      const cls = o.status === 'late' ? 'card card--late'
               : o.status === 'done' ? 'card card--done'
               : 'card card--on';
      li.className = cls;
      li.innerHTML = `
        <div class="card__title">Pedido #${o.id} — ${o.cliente}</div>
        <div class="card__meta">Entregador: ${o.entregador}</div>
      `;
      ul.appendChild(li);
      if(o.status==='late') late++;
      else if(o.status==='done') done++;
      else on++;
    });
    if (kpiLate) kpiLate.textContent = String(late).padStart(2,'0');
    if (kpiDone) kpiDone.textContent = String(done).padStart(2,'0');
    if (kpiOn)   kpiOn.textContent   = String(on).padStart(2,'0');
  };
  renderOrders(orders);

  // ---------- painel de status abrir/fechar ----------
  const statusBtn   = $('#statusToggle');
  const statusPanel = $('#statusPanel');

  const openStatus  = () => {
    statusPanel?.classList.remove('is-collapsed');
    statusBtn?.setAttribute('aria-expanded', 'true');
    if (window.__invalidateMap__) setTimeout(()=>window.__invalidateMap__(), 60);
  };
  const closeStatus = () => {
    statusPanel?.classList.add('is-collapsed');
    statusBtn?.setAttribute('aria-expanded', 'false');
  };

  statusBtn?.addEventListener('click', () => {
    if (!statusPanel) return;
    statusPanel.classList.contains('is-collapsed') ? openStatus() : closeStatus();
  });

  const mq = window.matchMedia('(min-width: 961px)');
  mq.matches ? closeStatus() : openStatus();
  mq.addEventListener?.('change', (e) => { e.matches ? closeStatus() : openStatus(); });

  // ---------- MAPA (Leaflet) — init robusto ----------
  const mapEl = $('#map');
  let map, darkTiles, lightTiles, currentTiles;

  // expõe helpers globais para outros módulos
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
    if (!mapEl) return; // sem container
    const w = mapEl.offsetWidth;
    const h = mapEl.offsetHeight;
    if (w < 100 || h < 100) return; // ainda sem tamanho útil

    if (typeof L === 'undefined') {
      console.error('[MAPA] Leaflet não carregou. Verifique o <script src="https://unpkg.com/leaflet...">');
      return;
    }
    if (map) return; // já criado

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

  // tenta criar já
  createMapIfReady();

  // cria quando o container ganhar tamanho
  if (mapEl && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(() => createMapIfReady());
    ro.observe(mapEl);
  }

  // plano B: após load, força min-height via atributo e tenta de novo
  window.addEventListener('load', () => {
    if (!map && mapEl) {
      root.setAttribute('data-debug-map', '1'); // min-height já tratado no CSS
      setTimeout(createMapIfReady, 100);
    }
  });

  // quando clicar no avatar → redireciona para settings.html
document.addEventListener('DOMContentLoaded', ()=>{
  const avatar = document.getElementById('userAvatar');
  if (!avatar) return;

  function goSettings(){
    window.location.href = 'settings.html';
  }

  avatar.addEventListener('click', goSettings);
  avatar.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') goSettings(); });
});


  // ---------- sessão: preenche saudação ----------
  (function hydrateUser(){
    try {
      const data = JSON.parse(sessionStorage.getItem('mr_auth') || 'null');
      const name = data?.user || 'Visitante';
      const greetSpan = $('#greetName');
      if (greetSpan) greetSpan.textContent = name;

      // Se quiser exigir login para ver a interface:
      // if (!data) window.location.href = 'index.html';
    } catch {
      const greetSpan = $('#greetName');
      if (greetSpan) greetSpan.textContent = 'Visitante';
    }
  })();
});
