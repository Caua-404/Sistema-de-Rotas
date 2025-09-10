import { $, saveLocal, readLocal } from './_utils.js';

/* ===== helpers ===== */
const fmt = (ts, lang = (JSON.parse(localStorage.getItem('mr_locale')||'{}').lang||'pt-BR')) =>
  new Intl.DateTimeFormat(lang, { dateStyle:'medium', timeStyle:'short' }).format(ts);

function uaInfo(){
  const ua = navigator.userAgent;
  const os = /Windows/i.test(ua) ? 'Windows'
          : /Mac OS X/i.test(ua) ? 'macOS'
          : /Android/i.test(ua) ? 'Android'
          : /iPhone|iPad|iPod/i.test(ua) ? 'iOS'
          : 'Desconhecido';
  const browser = /Edg\//.test(ua) ? 'Edge'
               : /Chrome\//.test(ua) ? 'Chrome'
               : /Safari\//.test(ua) ? 'Safari'
               : /Firefox\//.test(ua) ? 'Firefox'
               : 'Navegador';
  const device = /Mobile|Android|iPhone|iPad/i.test(ua) ? 'Dispositivo móvel' : 'Desktop/Laptop';
  const icon = /Android|iPhone|iPad/i.test(ua) ? '📱' : '💻';
  return { os, browser, device, icon };
}

function genId(){ return Math.random().toString(36).slice(2,10); }

/* ===== storage schema =====
  mr_sessions = [
    { id, name, os, browser, device, icon, ip, location, lastActive, trusted, current }
  ]
================================ */

function defaultSessions(){
  const now = Date.now();
  const me = uaInfo();
  return [
    { id: genId(), name: 'Este dispositivo', ...me, ip: '192.168.0.24', location: 'Belém, BR', lastActive: now, trusted: true, current: true },
    { id: genId(), name: 'Desktop Escritório', os:'Windows', browser:'Chrome', device:'Desktop/Laptop', icon:'💻', ip:'200.200.18.3', location:'São Paulo, BR', lastActive: now - 1000*60*60*26, trusted:false, current:false },
    { id: genId(), name: 'iPhone Pessoal', os:'iOS', browser:'Safari', device:'Dispositivo móvel', icon:'📱', ip:'179.12.88.4', location:'Belém, BR', lastActive: now - 1000*60*45, trusted:true, current:false },
  ];
}

/* ===== state ===== */
function readSessions(){
  const raw = readLocal('mr_sessions');
  if (Array.isArray(raw) && raw.length) return raw;
  const seed = defaultSessions();
  saveLocal('mr_sessions', seed);
  return seed;
}

function writeSessions(list){
  saveLocal('mr_sessions', list);
}

/* Se só existir o dispositivo atual, repovoa com mocks p/ facilitar o teste */
function seedIfOnlyCurrent(){
  let list = readSessions();
  const onlyOne = list.length === 1 && list[0].current;
  if (!onlyOne) return list;

  const seed = defaultSessions();
  // preserva o “current” existente e insere os demais
  const current = list[0];
  const others = seed.filter(s => !s.current);
  list = [current, ...others];
  writeSessions(list);
  return list;
}

/* ===== render ===== */
function render(){
  const list = readSessions();
  const ul = $('#sessList'); const badge = $('#sessCount');
  if (!ul) return;

  ul.innerHTML = list.map(s => `
    <li class="session-item" data-id="${s.id}" data-current="${s.current ? 'true' : 'false'}">
      <div class="session-item__icon">${s.icon || '💻'}</div>
      <div class="session-item__main">
        <div class="session-item__title">${s.current ? 'Este dispositivo' : s.name} ${s.current ? '• <small>(atual)</small>' : ''}</div>
        <div class="session-item__meta">
          ${s.browser} • ${s.os} • ${s.location} • IP ${s.ip} • ativo ${fmt(s.lastActive)}
        </div>
        <label class="mt-1">
          <input type="checkbox" data-act="trust" ${s.trusted ? 'checked' : ''}> Dispositivo confiável
        </label>
      </div>
      <div class="session-item__actions">
        <button class="btn btn--ghost btn-sm" type="button" data-act="rename">Renomear</button>
        ${s.current
          ? '<button class="btn btn--muted btn-sm" type="button" data-act="logout-self">Sair deste</button>'
          : '<button class="btn btn--primary btn-sm" type="button" data-act="revoke">Encerrar</button>'
        }
      </div>
    </li>
  `).join('');

  if (badge) {
    const count = list.length;
    badge.textContent = `${count} sessão${count>1?'s':''} ativa${count>1?'s':''}`;
  }
  $('#sessCurrent')?.classList.toggle('pill--accent', list.some(s=>s.current));
}

/* ===== actions ===== */
function rename(id){
  const list = readSessions();
  const s = list.find(x=>x.id===id); if (!s) return;
  const name = prompt('Novo nome para o dispositivo:', s.current ? 'Este dispositivo' : s.name);
  if (!name) return;
  s.name = name.trim();
  writeSessions(list); render();
}

function trustToggle(id, val){
  const list = readSessions();
  const s = list.find(x=>x.id===id); if (!s) return;
  s.trusted = !!val;
  writeSessions(list);
}

function revoke(id){
  let list = readSessions();
  const target = list.find(x=>x.id===id);
  if (!target) return;
  if (target.current) { alert('Use “Sair deste” para encerrar a sessão atual.'); return; }
  list = list.filter(x=>x.id!==id);
  writeSessions(list); render();
}

function logoutSelf(){
  alert('Sessão atual encerrada (mock). Redirecionar para login se necessário.');
  // window.location.href = 'index.html';
}

function logoutAll(){
  let list = readSessions();
  const me = list.find(x=>x.current);
  list = me ? [me] : [];
  writeSessions(list);
  render();
}

/* ===== refresh (agora repovoa mocks quando preciso) ===== */
function refresh(){
  let list = seedIfOnlyCurrent(); // repovoa se só houver o atual
  const now = Date.now();
  list = readSessions();
  list.forEach(s => {
    if (s.current) s.lastActive = now;
    else if (Math.random() > .5) s.lastActive = now - Math.floor(Math.random()*60)*60000;
  });
  writeSessions(list);
  render();
}

/* ===== init current session info ===== */
(function ensureCurrent(){
  const list = readSessions();
  const meInfo = uaInfo();
  let me = list.find(s=>s.current);
  if (!me){
    me = { id: genId(), name:'Este dispositivo', ...meInfo, ip:'127.0.0.1', location:'Local', lastActive:Date.now(), trusted:true, current:true };
    list.unshift(me);
  } else {
    me.browser = meInfo.browser; me.os = meInfo.os; me.device = meInfo.device; me.icon = meInfo.icon;
    me.lastActive = Date.now();
  }
  writeSessions(list);
})();

/* ===== wire events ===== */
$('#sessList')?.addEventListener('click', (e)=>{
  const li = e.target.closest('.session-item'); if (!li) return;
  const id = li.getAttribute('data-id');
  const act = e.target.getAttribute('data-act');
  if (act === 'rename') rename(id);
  if (act === 'revoke') revoke(id);
  if (act === 'logout-self') logoutSelf();
});
$('#sessList')?.addEventListener('change', (e)=>{
  const li = e.target.closest('.session-item'); if (!li) return;
  if (e.target.getAttribute('data-act') === 'trust'){
    trustToggle(li.getAttribute('data-id'), e.target.checked);
  }
});

$('#btnSessLogoutAll')?.addEventListener('click', logoutAll);
$('#btnSessRefresh')?.addEventListener('click', refresh);

/* ===== first paint ===== */
render();
