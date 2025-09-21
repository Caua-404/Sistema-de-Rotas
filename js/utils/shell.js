// js/utils/shell.js
const THEME_KEY = 'mr_theme';
const STATUS_KEY = 'mr_status_open';

const $  = (s, el=document)=>el.querySelector(s);
const $$ = (s, el=document)=>[...el.querySelectorAll(s)];

function applyTheme(theme){
  const root = document.documentElement;
  root.setAttribute('data-bs-theme', theme);
  try{ localStorage.setItem(THEME_KEY, theme); }catch{}
  // Se a página tiver mapa, sincroniza os tiles
  if (window.__setMapTheme__) window.__setMapTheme__(theme);
}

// define ativo na sidebar pelo caminho atual
function markActiveNav(){
  const here = location.pathname.split('/').pop() || 'index.html';
  $$('.nav__item').forEach(a=>{
    const href = (a.getAttribute('href')||'').split('/').pop();
    a.classList.toggle('is-active', href === here);
  });
}

function initSidebarMobile(){
  const btnOpen = $('#btnOpenSidebar');
  const sidebar = $('.sidebar');
  btnOpen?.addEventListener('click', ()=> sidebar?.classList.add('is-open'));
  document.addEventListener('pointerdown', (e)=>{
    if (!sidebar?.classList.contains('is-open')) return;
    const inside = sidebar.contains(e.target);
    const fromBtn = btnOpen?.contains(e.target);
    if (!inside && !fromBtn) sidebar.classList.remove('is-open');
  });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') sidebar?.classList.remove('is-open'); });
  matchMedia('(min-width:961px)').addEventListener?.('change', ev=>{
    if (ev.matches) sidebar?.classList.remove('is-open');
    if (window.__invalidateMap__) setTimeout(()=>window.__invalidateMap__(), 60);
  });
}

function initTheme(){
  const current = localStorage.getItem(THEME_KEY) || document.documentElement.getAttribute('data-bs-theme') || 'dark';
  applyTheme(current);

  const btn = $('#themeToggle');
  btn?.addEventListener('click', ()=>{
    const next = document.documentElement.getAttribute('data-bs-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
  });
  btn?.querySelector('.theme-switch__knob')?.addEventListener('click', (e)=>{ e.stopPropagation(); btn.click(); });

  // sincroniza em múltiplas abas
  window.addEventListener('storage', (e)=>{
    if (e.key === THEME_KEY && e.newValue) applyTheme(e.newValue);
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  initTheme();
  initSidebarMobile();
  markActiveNav();

  // opcional: restaurar estado do painel de status (se existir nessa página)
  const statusPanel = $('#statusPanel');
  const statusBtn   = $('#statusToggle');
  if (statusPanel && statusBtn){
    const open = () => { statusPanel.classList.remove('is-collapsed'); statusBtn.setAttribute('aria-expanded','true'); try{localStorage.setItem(STATUS_KEY,'1');}catch{} };
    const close= () => { statusPanel.classList.add('is-collapsed');    statusBtn.setAttribute('aria-expanded','false');try{localStorage.setItem(STATUS_KEY,'0');}catch{} };
    // estado salvo
    (localStorage.getItem(STATUS_KEY)==='1' ? open : close)();
    statusBtn.addEventListener('click', ()=> statusPanel.classList.contains('is-collapsed') ? open() : close());
  }
});
