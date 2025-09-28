importCatalogToGlobal();
ensureCartStorage();

const $grid  = document.querySelector('#grid');
const $search= document.querySelector('#search');
const $chips = document.querySelector('#chips-categories');
const $sort  = document.querySelector('#sort');

const STATE_KEY = 'mr_home_state';
const FAVS_KEY  = 'mr_favs';

const CATS = ['lanche','pizza','japonesa','brasileira'];

let restaurants = window.MR_CATALOG.restaurants.slice(0);
let favs = new Set(JSON.parse(localStorage.getItem(FAVS_KEY) || '[]'));

const state = loadState() || { q:'', cat:[], sort:'eta' };

init();

function init(){
  // montar chips
  renderChips();
  // aplicar estado salvo
  $search.value = state.q || '';
  $sort.value   = state.sort || 'eta';
  // listeners
  $search.addEventListener('input', debounce(onFilterChange, 180));
  $sort.addEventListener('change', onFilterChange);
  $chips.addEventListener('click', (ev)=>{
    const chip = ev.target.closest('.chip');
    if(!chip) return;
    const cat = chip.dataset.cat;
    if(!cat) return;
    if(state.cat.includes(cat)){
      state.cat = state.cat.filter(c=>c!==cat);
      chip.setAttribute('aria-pressed','false');
    } else {
      state.cat.push(cat);
      chip.setAttribute('aria-pressed','true');
    }
    persistState();
    render();
  });

  // esqueleto e render
  renderSkeletons();
  requestAnimationFrame(render);
}

function renderChips(){
  const html = CATS.map(c=>{
    const pressed = state.cat.includes(c);
    const label = c[0].toUpperCase() + c.slice(1);
    return `<button type="button" class="chip" data-cat="${c}" aria-pressed="${pressed}">${label}</button>`;
  }).join('');
  $chips.innerHTML = html;
}

function renderSkeletons(){
  $grid.innerHTML = Array.from({length: 8}).map(()=>`<div class="skeleton skel-card"></div>`).join('');
}

function render(){
  let list = restaurants.slice(0);

  // busca + categorias
  const q = ($search.value||'').trim().toLowerCase();
  if(q) list = list.filter(r => r.name.toLowerCase().includes(q) || r.categories.join(' ').toLowerCase().includes(q));
  if(state.cat.length) list = list.filter(r => state.cat.some(c=>r.categories.includes(c)));

  // ordenação
  switch($sort.value){
    case 'rating': list.sort((a,b)=>b.rating-a.rating); break;
    case 'distance': list.sort((a,b)=>a.distanceKm-b.distanceKm); break;
    case 'fee': list.sort((a,b)=>a.fee-b.fee); break;
    default: list.sort((a,b)=>a.etaMin-b.etaMin); break;
  }

  // render cards
  $grid.innerHTML = list.map(r => cardHTML(r)).join('');

  // listeners dos cards
  $grid.querySelectorAll('[data-fav]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-fav');
      const pressed = btn.getAttribute('aria-pressed') === 'true';
      if(pressed){ favs.delete(id); } else { favs.add(id); }
      localStorage.setItem(FAVS_KEY, JSON.stringify([...favs]));
      btn.setAttribute('aria-pressed', (!pressed).toString());
    });
  });

  // lazy images (nativo + fallback)
  const imgs = $grid.querySelectorAll('img[data-src]');
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries, obs)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          const img = e.target; img.src = img.dataset.src; img.removeAttribute('data-src');
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '120px' });
    imgs.forEach(img=>io.observe(img));
  } else {
    imgs.forEach(img=>{ img.src = img.dataset.src; img.removeAttribute('data-src'); });
  }
}

function cardHTML(r){
  const isFav = favs.has(r.id);
  const money = (v)=> v === 0 ? 'taxa grátis' : v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const cats  = r.categories.join(' • ');
  return `
    <article class="card-restaurant">
      <img class="banner" alt="${r.name}" data-src="${r.banner}" loading="lazy">
      <div class="body">
        <div class="title-row">
          <div class="title">${r.name}</div>
          <button class="fav-btn" aria-label="Favoritar ${r.name}" aria-pressed="${isFav}" data-fav="${r.id}">★</button>
        </div>
        <div class="meta">
          <span>⭐ ${r.rating.toFixed(1)}</span>
          <span>⏱️ ${r.etaMin}–${r.etaMax} min</span>
          <span>📍 ${r.distanceKm.toFixed(1)} km</span>
          <span>💲 ${money(r.fee)}</span>
        </div>
        <div class="meta">${cats}</div>
        <div class="actions">
          ${r.isOpen ? `<span class="badge badge--open">Aberto</span>` : `<span class="badge badge--closed">Fechado</span>`}
          <a class="btn btn-primary btn-card" href="store.html?rid=${encodeURIComponent(r.id)}">Ver cardápio</a>
        </div>
      </div>
    </article>
  `;
}

function onFilterChange(){
  state.q = $search.value;
  state.sort = $sort.value;
  persistState();
  render();
}

function persistState(){
  try{ localStorage.setItem(STATE_KEY, JSON.stringify(state)); }catch{}
}
function loadState(){
  try{ return JSON.parse(localStorage.getItem(STATE_KEY)||'null'); }catch{ return null; }
}

function debounce(fn, ms){
  let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); };
}
