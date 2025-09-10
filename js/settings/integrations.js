import { $, saveLocal, readLocal } from './_utils.js';

/* storage key */
const K = { LIST:'mr_integrations', LOG:'mr_int_logs' };

/* catálogo de integrações suportadas (id fixo) */
const CATALOG = [
  { id:'erp',  name:'ERP',        icon:'📦', scopes:['orders:r','orders:w','catalog:r'] },
  { id:'pay',  name:'Pagamentos', icon:'💳', scopes:['charges:w','webhooks:r'] },
  { id:'maps', name:'Mapas',      icon:'🗺️', scopes:['geocode:r','route:r'] },
  { id:'msg',  name:'Mensageria', icon:'✉️', scopes:['email:w','sms:w','whatsapp:w'] },
  { id:'wh',   name:'Webhooks',   icon:'🔔', scopes:['pedido_criado','pedido_atualizado','pagamento_liquidado'] },
];

/* helpers */
const nowFmt = () => {
  const lang = (readLocal('mr_locale')?.lang) || 'pt-BR';
  return new Intl.DateTimeFormat(lang,{dateStyle:'medium',timeStyle:'short'}).format(Date.now());
};
const log = (item) => {
  const list = readLocal(K.LOG) || [];
  list.unshift({ at: Date.now(), ...item });
  saveLocal(K.LOG, list.slice(0,200));
  renderLogs();
};

/* estado */
function readIntegrations(){
  let list = readLocal(K.LIST);
  if (!Array.isArray(list)){
    list = CATALOG.map(c => ({
      id:c.id, name:c.name, icon:c.icon,
      status:'disconnected',
      mode:'test',
      baseUrl:'', apiKey:'', apiSecret:'',
      webhookUrl:'', webhookSecret:'',
      scopes:[], lastSync:null, error:null
    }));
    saveLocal(K.LIST, list);
  }
  return list;
}
function writeIntegrations(list){ saveLocal(K.LIST, list); }

/* render cards */
function renderGrid(){
  const grid = $('#intGrid'); if (!grid) return;
  const list = readIntegrations();
  grid.innerHTML = list.map(i => `
    <div class="int-card" data-id="${i.id}">
      <div class="int-card__head">
        <div class="int-card__title">${i.icon} ${i.name}</div>
        <span class="badge status ${i.status==='connected'?'is-on':''}">${i.status==='connected'?'Conectado':'Desconectado'}</span>
      </div>
      <div class="int-card__meta">
        ${i.status==='connected'
          ? `Modo: ${i.mode==='prod'?'Produção':'Sandbox'} • Última sync: ${i.lastSync?new Date(i.lastSync).toLocaleString(): '—'}`
          : 'Não conectado'
        }
      </div>
      <div class="int-actions">
        <button class="btn btn--primary btn-sm" data-act="${i.status==='connected'?'edit':'connect'}">${i.status==='connected'?'Editar':'Conectar'}</button>
        ${i.status==='connected' ? `<button class="btn btn--muted btn-sm" data-act="test">Testar</button>`:''}
        ${i.status==='connected' ? `<button class="btn btn--ghost btn-sm" data-act="disconnect">Desconectar</button>`:''}
        ${i.status==='connected' ? `<button class="btn btn--ghost btn-sm" data-act="sync">Sincronizar</button>`:''}
      </div>
      ${i.status==='connected' && i.scopes?.length
        ? `<div class="int-card__meta">Escopos: ${i.scopes.join(', ')}</div>`
        : ''
      }
      ${i.error ? `<div class="text-muted" style="color:#ffb4b4">Erro recente: ${i.error}</div>`:''}
    </div>
  `).join('');
}

/* logs */
function renderLogs(){
  const tbody = $('#intLogsBody'); if (!tbody) return;
  const list = readLocal(K.LOG) || [];
  if (!list.length){
    tbody.innerHTML = `<tr><td colspan="5">Nenhum evento ainda.</td></tr>`;
    return;
  }
  const lang = (readLocal('mr_locale')?.lang) || 'pt-BR';
  const fmt = ts => new Intl.DateTimeFormat(lang,{dateStyle:'medium',timeStyle:'short'}).format(ts);
  tbody.innerHTML = list.map(e=>`
    <tr>
      <td>${fmt(e.at)}</td>
      <td>${e.integration}</td>
      <td>${e.action}</td>
      <td>${e.status}</td>
      <td>${e.detail||'—'}</td>
    </tr>
  `).join('');
}

/* ===== modal ===== */
let currentId = null;
function openModal(id){
  currentId = id;
  const list = readIntegrations();
  const item = list.find(x=>x.id===id);
  const spec = CATALOG.find(c=>c.id===id);

  $('#intModalTitle').textContent = `Configurar — ${item.name}`;
  $('#intMode').value = item.mode || 'test';
  $('#intBaseUrl').value = item.baseUrl || '';
  $('#intApiKey').value = item.apiKey || '';
  $('#intApiSecret').value = item.apiSecret || '';
  $('#intWebhookUrl').value = item.webhookUrl || '';
  $('#intWebhookSecret').value = item.webhookSecret || '';

  const wrap = $('#intScopesWrap');
  wrap.innerHTML = (spec.scopes||[]).map(sc => `
    <label><input type="checkbox" value="${sc}" ${item.scopes?.includes(sc)?'checked':''}> ${sc}</label>
  `).join('') || '<span class="text-muted">Esta integração não usa escopos.</span>';

  $('#intModal').hidden = false;
}
function closeModal(){ $('#intModal').hidden = true; currentId = null; }

$('#btnIntCancel')?.addEventListener('click', closeModal);
$('#intModal')?.addEventListener('click', e=>{ if(e.target.id==='intModal') closeModal(); });

$('#btnIntSave')?.addEventListener('click', ()=>{
  if (!currentId) return;
  const list = readIntegrations();
  const item = list.find(x=>x.id===currentId);
  const checks = [...document.querySelectorAll('#intScopesWrap input[type="checkbox"]')];
  item.mode = $('#intMode').value;
  item.baseUrl = $('#intBaseUrl').value.trim();
  item.apiKey = $('#intApiKey').value.trim();
  item.apiSecret = $('#intApiSecret').value.trim();
  item.webhookUrl = $('#intWebhookUrl').value.trim();
  item.webhookSecret = $('#intWebhookSecret').value.trim();
  item.scopes = checks.filter(c=>c.checked).map(c=>c.value);
  item.status = 'connected';
  item.lastSync = Date.now();
  item.error = null;

  writeIntegrations(list);
  renderGrid();
  closeModal();
  log({ integration:item.name, action:'save', status:'ok', detail:`Modo ${item.mode}` });
});

/* ===== ações nos cartões ===== */
$('#intGrid')?.addEventListener('click', (e)=>{
  const card = e.target.closest('.int-card'); if (!card) return;
  const id = card.getAttribute('data-id');
  const act = e.target.getAttribute('data-act');

  const list = readIntegrations();
  const item = list.find(x=>x.id===id);

  switch (act) {
    case 'connect':
    case 'edit':
      openModal(id);
      break;

    case 'disconnect':
      item.status = 'disconnected';
      item.lastSync = null;
      writeIntegrations(list); renderGrid();
      log({ integration:item.name, action:'disconnect', status:'ok' });
      break;

    case 'sync':
      item.lastSync = Date.now();
      writeIntegrations(list); renderGrid();
      log({ integration:item.name, action:'sync', status:'ok' });
      break;

    case 'test':
      // mock de teste: 80% ok / 20% erro
      const ok = Math.random() > 0.2;
      if (ok){
        item.error = null; writeIntegrations(list);
        log({ integration:item.name, action:'test', status:'200', detail:'OK' });
        alert(`Teste de ${item.name}: sucesso!`);
      } else {
        item.error = 'Timeout / 504'; writeIntegrations(list); renderGrid();
        log({ integration:item.name, action:'test', status:'504', detail:'Timeout' });
        alert(`Teste de ${item.name}: falhou (timeout).`);
      }
      break;
  }
});

/* botões abaixo da tabela */
$('#btnIntLogsClear')?.addEventListener('click', ()=>{
  saveLocal(K.LOG, []);
  renderLogs();
});
$('#btnIntSyncAll')?.addEventListener('click', ()=>{
  const list = readIntegrations();
  const now = Date.now();
  list.forEach(i => { if (i.status==='connected') i.lastSync = now; });
  writeIntegrations(list);
  renderGrid();
  log({ integration:'Todas', action:'sync-all', status:'ok', detail:`${nowFmt()}` });
});

/* init */
renderGrid();
renderLogs();
