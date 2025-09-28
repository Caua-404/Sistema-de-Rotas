(function(){
  // Remove sidebar legado (<aside class="sidebar">) se existir para evitar duplicidade
  const legacyAside = document.querySelector('aside.sidebar');
  const targetAside = document.querySelector('#sidebar');
  if (legacyAside && legacyAside !== targetAside) legacyAside.remove();

  function createSidebar() {
    const aside = document.querySelector('#sidebar');
    if (!aside) return;

    const NAV_ITEMS = [
      { href: 'interface.html',  label: 'Interface',    icon: '🏠' },
      { href: 'entregas.html',   label: 'Entregas',     icon: '📦' },
      { href: 'motoboys.html',   label: 'Motoboys',     icon: '🛵' },
      { href: 'dashboard.html',  label: 'Relatório',    icon: '📈' },
      { href: 'settings.html',   label: 'Configuração', icon: '⚙️' },
      { href: 'home.html',       label: 'Restaurantes', icon: '🍽️' },
      { href: 'cart.html',       label: 'Checkout',     icon: '🧾' },
      { href: 'track.html',      label: 'Acompanhar',   icon: '🗺️' },
      { href: 'courier.html',    label: 'Motoboy (PWA)',icon: '📲' },
    ];

    const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const isActive = (href) => href.toLowerCase() === here;

    // Marca com ícone central — sem inline-style (estilos no CSS)
    const brandHTML = `
      <div class="sidebar-brand brand">
        <span class="logo" aria-label="Moto Rotas">
          <span class="logo__left">MOTO</span>
          <span class="logo__gap"><img src="assets/Logo.png" alt="Ícone motoboy"></span>
          <span class="logo__right">ROTAS</span>
        </span>
      </div>
    `;

    const itemsHTML = NAV_ITEMS.map(x => `
      <li>
        <a class="side-card ${isActive(x.href) ? 'is-active' : ''}" href="${x.href}">
          <span class="icon">${x.icon}</span>
          <span class="label">${x.label}</span>
        </a>
      </li>
    `).join('');

    aside.innerHTML = `${brandHTML}
      <nav class="sidebar-nav" role="navigation">
        <ul class="side-list">${itemsHTML}</ul>
      </nav>`;

    // A11y: marca item atual
    aside.querySelectorAll('.side-card.is-active')
      .forEach(a => a.setAttribute('aria-current','page'));

    // Toggle mobile
    const toggleBtn = document.querySelector('#btnOpenSidebar');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-open');
      });
    }

    // No mobile, fechar ao clicar em um link do menu
    aside.addEventListener('click', (ev) => {
      const link = ev.target.closest('a.side-card');
      if (!link) return;
      if (window.matchMedia('(max-width: 1024px)').matches) {
        document.body.classList.remove('sidebar-open');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createSidebar);
  } else {
    createSidebar();
  }
})();
