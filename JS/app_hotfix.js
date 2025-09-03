// ===== MAPA ROBUSTO: inicializa somente quando houver TAMANHO =====
(function () {
  const root = document.documentElement;

  // Preferência de tema e sincronização
  const THEME_KEY = 'mr_theme';
  const themeBtn = document.getElementById('themeToggle');

  function applyTheme(theme) {
    root.setAttribute('data-bs-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    if (window.__setMapTheme__) window.__setMapTheme__(theme);
  }
  applyTheme(localStorage.getItem(THEME_KEY) || root.getAttribute('data-bs-theme') || 'dark');

  // Clique na cápsula e no knob
  themeBtn?.addEventListener('click', () => {
    const next = root.getAttribute('data-bs-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
  });
  themeBtn?.querySelector('.theme-switch__knob')?.addEventListener('click', (e) => {
    e.stopPropagation();
    themeBtn.click();
  });

  // ===== Leaflet: init robusto =====
  const mapEl = document.getElementById('map');
  if (!mapEl) {
    console.warn('[MAPA] #map não encontrado no DOM.');
    return;
  }

  // Evita recriar
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

  // Criar mapa quando tiver tamanho útil
  function createMapIfReady() {
    const w = mapEl.offsetWidth;
    const h = mapEl.offsetHeight;
    if (w < 100 || h < 100) return; // ainda sem tamanho, espere

    if (!window.L) {
      console.error('[MAPA] Leaflet não carregou. Confira <script src="https://unpkg.com/leaflet...">');
      return;
    }
    if (map) return; // já criado

    map = L.map(mapEl, { center: [-23.55, -46.63], zoom: 12, zoomControl: true });

    // tiles claro/escuro (CARTO)
    darkTiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { attribution: '© OpenStreetMap, © CARTO' }
    );
    lightTiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '© OpenStreetMap, © CARTO' }
    );

    // tema atual
    const initialTheme = root.getAttribute('data-bs-theme') === 'light' ? 'light' : 'dark';
    currentTiles = initialTheme === 'light' ? lightTiles : darkTiles;
    currentTiles.addTo(map);

    // invalida após criar (corrige quaisquer layouts)
    setTimeout(() => map.invalidateSize(), 0);

    // POIs exemplo
    const restaurants = [
      { name: 'Restaurante Natsu', lat: -23.561, lng: -46.657 },
      { name: 'Cantina da Praça', lat: -23.559, lng: -46.635 }
    ];
    const hospitals = [{ name: 'Hospital Central', lat: -23.553, lng: -46.645 }];
    const traffic = [
      { name: 'Semáforo 1', lat: -23.552, lng: -46.632 },
      { name: 'Semáforo 2', lat: -23.566, lng: -46.641 }
    ];

    const restGroup = L.layerGroup(restaurants.map(p => L.marker([p.lat, p.lng]).bindPopup(`🍽️ ${p.name}`)));
    const hospGroup = L.layerGroup(hospitals.map(p => L.marker([p.lat, p.lng]).bindPopup(`🏥 ${p.name}`)));
    const trafGroup = L.layerGroup(traffic.map(p => L.marker([p.lat, p.lng]).bindPopup(`🚦 ${p.name}`)));

    restGroup.addTo(map);
    hospGroup.addTo(map);
    trafGroup.addTo(map);

    L.control.layers(null, {
      'Restaurantes': restGroup,
      'Hospitais': hospGroup,
      'Semáforos': trafGroup
    }, { collapsed: true }).addTo(map);

    console.log('[MAPA] Inicializado com', w, 'x', h);
  }

  // Tenta já
  createMapIfReady();

  // Observa mudanças de tamanho; cria quando estiver pronto
  const ro = new ResizeObserver(() => createMapIfReady());
  ro.observe(mapEl);

  // Plano B: força debug se nada acontecer
  window.addEventListener('load', () => {
    if (!map) {
      root.setAttribute('data-debug-map', '1'); // força min-height via CSS
      setTimeout(() => { createMapIfReady(); }, 100);
    }
  });
})();