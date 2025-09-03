/* App principal: tema, sidebar, autocomplete, painel de status e mapa (Leaflet) */
document.addEventListener('DOMContentLoaded', () => {
  /* ===== Sidebar (mobile): abrir/fechar ===== */
  const btnOpen = document.getElementById('btnOpenSidebar');
  const btnClose = document.getElementById('btnCloseSidebar'); // pode não existir
  const sidebar = document.querySelector('.sidebar');

  btnOpen?.addEventListener('click', () => sidebar.classList.add('is-open'));
  btnClose?.addEventListener('click', () => sidebar.classList.remove('is-open'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') sidebar?.classList.remove('is-open'); });
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !btnOpen?.contains(e.target)) sidebar?.classList.remove('is-open');
  });

  /* ===== Navegação: estado ativo ===== */
  document.querySelectorAll('.nav__item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav__item').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
  });

  /* ===== Tema (switch com knob) ===== */
  const root = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');
  const THEME_KEY = 'mr_theme';

  function applyTheme(theme){
    root.setAttribute('data-bs-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    setMapTheme(theme); // sincroniza mapa
  }
  applyTheme(localStorage.getItem(THEME_KEY) || root.getAttribute('data-bs-theme') || 'dark');

  themeBtn?.addEventListener('click', () => {
    const next = root.getAttribute('data-bs-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
  });
  themeBtn?.querySelector('.theme-switch__knob')?.addEventListener('click', (e) => {
    e.stopPropagation(); themeBtn.click();
  });

  /* ===== Autocomplete (mock) ===== */
  const input = document.getElementById('searchInput');
  const list  = document.getElementById('searchSuggest');
  const SUGGESTIONS = [
    {label: 'São Paulo, SP', lat:-23.5505, lng:-46.6333},
    {label: 'Rio de Janeiro, RJ', lat:-22.9068, lng:-43.1729},
    {label: 'Belo Horizonte, MG', lat:-19.9167, lng:-43.9345},
    {label: 'Avenida Paulista', lat:-23.5614, lng:-46.6557},
    {label: 'Rua XV de Novembro, Curitiba', lat:-25.4284, lng:-49.2733},
  ];
  function updateSuggestions(value){
    const v = value.trim().toLowerCase();
    if (!v){ list.classList.remove('is-open'); list.innerHTML=''; return; }
    const items = SUGGESTIONS.filter(s => s.label.toLowerCase().includes(v)).slice(0,8);
    if (!items.length){ list.classList.remove('is-open'); list.innerHTML=''; return; }
    list.innerHTML = items.map((s,i)=>`<li role="option" data-i="${i}">${s.label}</li>`).join('');
    list.classList.add('is-open');
  }
  input?.addEventListener('input', e => updateSuggestions(e.target.value));
  list?.addEventListener('click', e => {
    const li = e.target.closest('li'); if (!li) return;
    const { i } = li.dataset; const s = SUGGESTIONS[Number(i)];
    input.value = s.label; list.classList.remove('is-open'); list.innerHTML='';
    map?.flyTo([s.lat, s.lng], 13, {duration: .6});
  });

  /* ===== KPI + Cards (mock) ===== */
  const orders = [
    { id:1243, cliente:'Alexandre', entregador:'Lula',   status:'late' },
    { id:1244, cliente:'Maria Souza', entregador:'Thiago', status:'done' },
    { id:1245, cliente:'Ana Lima',    entregador:'Pedro',  status:'on'   },
  ];
  const ul = document.getElementById('ordersList');
  const kpiLate = document.getElementById('kpiLate');
  const kpiDone = document.getElementById('kpiDone');
  const kpiOn   = document.getElementById('kpiOn');

  function renderOrders(listData){
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
  }
  renderOrders(orders);

  /* ===== Painel (📦) abrir/fechar ===== */
  const statusBtn   = document.getElementById('statusToggle');
  const statusPanel = document.getElementById('statusPanel');

  function openStatus(){ 
    statusPanel?.classList.remove('is-collapsed');
    statusBtn?.setAttribute('aria-expanded', 'true');
    if (window.__invalidateMap__) setTimeout(()=>window.__invalidateMap__(), 60);
  }
  function closeStatus(){ 
    statusPanel?.classList.add('is-collapsed');
    statusBtn?.setAttribute('aria-expanded', 'false');
  }
  statusBtn?.addEventListener('click', () => {
    if (!statusPanel) return;
    statusPanel.classList.contains('is-collapsed') ? openStatus() : closeStatus();
  });
  if (window.matchMedia('(min-width: 961px)').matches) closeStatus(); else openStatus();

  /* ===== Leaflet Map ===== */
  let map, darkTiles, lightTiles, currentTiles;

  function initMap(){
    const mapEl = document.getElementById('map');
    if (!mapEl) return;
    map = L.map(mapEl, { center:[-23.55,-46.63], zoom:12, zoomControl:true });

    darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:'© OpenStreetMap, © CARTO'
    });
    lightTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:'© OpenStreetMap, © CARTO'
    });

    currentTiles = (document.documentElement.getAttribute('data-bs-theme') === 'light') ? lightTiles : darkTiles;
    currentTiles.addTo(map);

    setTimeout(()=> map.invalidateSize(), 0);

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
  }

  function setMapTheme(theme){
    if (!map) return;
    const newTiles = theme === 'light' ? lightTiles : darkTiles;
    if (currentTiles) map.removeLayer(currentTiles);
    newTiles.addTo(map); currentTiles = newTiles;
    setTimeout(()=> map.invalidateSize(), 150);
  }

  initMap();

  /* ===== Sessão: pega usuário salvo no login e preenche ===== */
(function hydrateUser(){
  try {
    const data = JSON.parse(sessionStorage.getItem('mr_auth') || 'null');
    const name = data?.user || 'Visitante';
    const greetSpan = document.getElementById('greetName');
    if (greetSpan) greetSpan.textContent = name;

    // Se você quiser exigir login, descomente:
    if (!data) window.location.href = 'login.html';

    // Avatar: se no futuro você salvar um avatar na sessão/localStorage, use:
    // const avatar = data?.avatar || localStorage.getItem('mr_avatar');
    // if (avatar) document.getElementById('userAvatar').src = avatar;
  } catch (e) {
    // fallback seguro
    const greetSpan = document.getElementById('greetName');
    if (greetSpan) greetSpan.textContent = 'Visitante';
  }
})();
});
