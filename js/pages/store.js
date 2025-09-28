importCatalogToGlobal();
ensureCartStorage();

const params = new URLSearchParams(location.search);
const rid = params.get('rid');

const $hero = document.querySelector('#store-hero');
const $cats = document.querySelector('#store-cats');
const $menu = document.querySelector('#store-menu');
const $cart = document.querySelector('#store-cart');

const store = window.MR_CATALOG.restaurants.find(r=>String(r.id)===String(rid)) || window.MR_CATALOG.restaurants[0];

function money(v){ return v.toLocaleString('pt-BR',{style:'currency', currency:'BRL'}); }

function renderHero(){
  $hero.innerHTML = `
    <div class="title">${store.name}</div>
    <div class="meta">
      <span>⭐ ${store.rating.toFixed(1)}</span>
      <span>⏱️ ${store.etaMin}–${store.etaMax} min</span>
      <span>📍 ${store.distanceKm.toFixed(1)} km</span>
      <span>💲 taxa ${store.fee===0 ? 'grátis' : money(store.fee)}</span>
    </div>
    <div class="meta">${store.categories.join(' • ')}</div>
  `;
}
function renderCats(){
  const cats = window.MR_CATALOG.menus[store.id].map(c=>`<a href="#cat-${c.id}" data-cat="${c.id}">${c.title}</a>`).join('');
  $cats.innerHTML = cats;
  // Scroll spy
  const anchors = $cats.querySelectorAll('a');
  const setCurrent = id=>{
    anchors.forEach(a=>a.setAttribute('aria-current', String(a.dataset.cat)===String(id)));
  };
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ setCurrent(e.target.dataset.catId); } });
  },{ rootMargin:"-40% 0px -55% 0px", threshold:.01 });
  document.querySelectorAll('.menu-category').forEach(sec=>obs.observe(sec));
}
function renderMenu(){
  const cats = window.MR_CATALOG.menus[store.id];
  $menu.innerHTML = cats.map(c => `
    <section class="menu-category" id="cat-${c.id}" data-cat-id="${c.id}">
      <h3>${c.title}</h3>
      ${c.items.map(item => `
        <div class="menu-item">
          <div class="info">
            <div class="title">${item.title}</div>
            <div class="desc">${item.desc||''}</div>
            <div class="price">${money(item.price)}</div>
            <button class="btn btn-primary btn-sm" data-add="${item.id}">Adicionar</button>
          </div>
          ${item.image ? `<img alt="${item.title}" src="${item.image}">` : '<div></div>'}
        </div>
      `).join('')}
    </section>
  `).join('');
  $menu.addEventListener('click', ev=>{
    const btn = ev.target.closest('[data-add]');
    if(!btn) return;
    const itemId = btn.getAttribute('data-add');
    window.MR_CART.addItem({ restaurantId: store.id, itemId, qty:1 });
    renderCart();
  });
}
function renderCart(){
  const cart = window.MR_CART.state();
  const fees = store.fee||0;
  const subtotal = cart.subtotal;
  const total = subtotal + fees;
  const lines = cart.items.map(it => `
    <div class="cart-line">
      <span>${it.title} × ${it.qty}</span>
      <span>${money(it.total)}</span>
    </div>
  `).join('') || `<div class="text-muted">Seu carrinho está vazio.</div>`;
  $cart.innerHTML = `
    <div class="cart-lines">${lines}</div>
    <div class="cart-totals">
      <div class="cart-line"><span>Subtotal</span><span>${money(subtotal)}</span></div>
      <div class="cart-line"><span>Taxa</span><span>${money(fees)}</span></div>
      <div class="cart-line" style="font-weight:700;"><span>Total</span><span>${money(total)}</span></div>
    </div>
    <div class="cart-footer">
      <a class="btn btn-primary btn-checkout" href="cart.html?rid=${store.id}">Ir para o checkout</a>
    </div>
  `;
}

renderHero();
renderMenu();
renderCats();
renderCart();
