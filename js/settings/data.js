import { $, saveLocal, readLocal } from './_utils.js';

/* state keys */
const K = {
  DATA: 'mr_data',
  EXPORT: 'mr_last_export',   // { at:number, name:string, size:number }
  ERASE: 'mr_erasure',        // { scheduledAt:number }
  RECT: 'mr_rectify_requests' // string[]
};

function fmt(ts){
  try {
    const lang = (readLocal('mr_locale')?.lang) || 'pt-BR';
    return new Intl.DateTimeFormat(lang, { dateStyle:'medium', timeStyle:'short' }).format(ts);
  } catch { return new Date(ts).toLocaleString(); }
}

function updateExportMeta(meta){
  const el = $('#dataExportMeta'); const dl = $('#btnDataDownload');
  if (!el || !dl) return;
  if (!meta){ el.textContent = 'Nenhum pacote gerado ainda.'; dl.disabled = true; return; }
  el.textContent = `Último pacote: ${meta.name} • ${Math.round(meta.size/1024)} KB • ${fmt(meta.at)}`;
  dl.disabled = false;
}

function hydrate(){
  /* retention & flags */
  const d = readLocal(K.DATA) || { retention:'12m', restrict:false, pausePerso:false };
  $('#dataRetention').value = d.retention || '12m';
  $('#dataRestrict').checked = !!d.restrict;
  $('#dataPersonalizePause').checked = !!d.pausePerso;

  /* export meta */
  const meta = readLocal(K.EXPORT);
  updateExportMeta(meta);

  /* erasure */
  const er = readLocal(K.ERASE);
  const cancelBtn = $('#btnEraseCancel'); const metaEl = $('#eraseMeta');
  if (er?.scheduledAt){
    cancelBtn.hidden = false;
    metaEl.textContent = `Exclusão agendada para ${fmt(er.scheduledAt)}. Você pode cancelar até essa data.`;
  } else {
    cancelBtn.hidden = true;
    metaEl.textContent = 'Ao agendar a exclusão, você poderá desfazer até a data limite.';
  }
}
hydrate();

/* persist simple prefs */
function persistPrefs(){
  const data = {
    retention: $('#dataRetention')?.value || '12m',
    restrict: !!$('#dataRestrict')?.checked,
    pausePerso: !!$('#dataPersonalizePause')?.checked
  };
  saveLocal(K.DATA, data);
}

/* export helpers (mock) */
function blobDownload(data, filename, mime='application/json'){
  const blob = new Blob([data], {type:mime});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  return blob.size;
}

function buildUserSnapshot(){
  // colete apenas dados não sensíveis aqui (mock)
  const profile = readLocal('mr_account') || { name:'Usuário', email:'usuario@exemplo.com', cnpj:'--' };
  const prefs = {
    appearance: readLocal('mr_appearance'),
    locale: readLocal('mr_locale'),
    access: readLocal('mr_access'),
    privacy: readLocal('mr_privacy'),
    notif: readLocal('mr_notif'),
    sessions: readLocal('mr_sessions')?.map(s=>({ ...s, ip: undefined })) // remove IP neste mock
  };
  return { exportedAt: Date.now(), profile, prefs };
}

/* events: export */
$('#btnDataRequest')?.addEventListener('click', ()=>{
  const snap = buildUserSnapshot();
  const json = JSON.stringify(snap, null, 2);
  const name = `moto-rota-export-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
  const size = blobDownload(json, name, 'application/json');
  saveLocal(K.EXPORT, { at: Date.now(), name, size });
  updateExportMeta(readLocal(K.EXPORT));
  alert('Pacote gerado!');
});

$('#btnDataDownload')?.addEventListener('click', ()=>{
  const meta = readLocal(K.EXPORT);
  if (!meta){ alert('Não há pacote para baixar.'); return; }
  // reconstroi o snapshot e baixa novamente
  const snap = buildUserSnapshot();
  const json = JSON.stringify(snap, null, 2);
  blobDownload(json, meta.name, 'application/json');
});

$('#btnDataCsv')?.addEventListener('click', ()=>{
  const rows = [
    ['pedido_id','cliente','status','valor'],
    ['1243','Alexandre','late','99.90'],
    ['1244','Maria','done','59.00'],
  ];
  const csv = rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
  blobDownload(csv, 'moto-rota-pedidos.csv', 'text/csv');
});

$('#btnDataPdf')?.addEventListener('click', ()=>{
  const txt = 'Resumo de dados (mock). Gere PDF real no backend.';
  blobDownload(txt, 'moto-rota-resumo.pdf', 'application/pdf');
});

/* events: prefs */
$('#dataRetention')?.addEventListener('change', persistPrefs);
$('#dataRestrict')?.addEventListener('change', persistPrefs);
$('#dataPersonalizePause')?.addEventListener('change', persistPrefs);

/* rectification modal */
const rectModal = $('#rectifyModal');
$('#btnRectifyOpen')?.addEventListener('click', ()=> rectModal.hidden = false);
$('#btnRectifyCancel')?.addEventListener('click', ()=> rectModal.hidden = true);
$('#rectifyModal')?.addEventListener('click', e=> { if (e.target === rectModal) rectModal.hidden = true; });
$('#btnRectifySend')?.addEventListener('click', ()=>{
  const msg = ($('#rectifyText')?.value || '').trim();
  if (!msg){ alert('Descreva o que precisa ser corrigido.'); return; }
  const list = readLocal(K.RECT) || [];
  list.push({ at: Date.now(), msg });
  saveLocal(K.RECT, list);
  rectModal.hidden = true;
  alert('Solicitação registrada! Nossa equipe entrará em contato.');
});

/* erasure modal */
const eraseModal = $('#eraseModal');
$('#btnEraseOpen')?.addEventListener('click', ()=> eraseModal.hidden = false);
$('#btnEraseCancelModal')?.addEventListener('click', ()=> eraseModal.hidden = true);
$('#eraseModal')?.addEventListener('click', e=> { if (e.target === eraseModal) eraseModal.hidden = true; });

$('#btnEraseSchedule')?.addEventListener('click', ()=>{
  const txt = ($('#eraseConfirmText')?.value || '').trim().toUpperCase();
  const pw  = ($('#erasePassword')?.value || '').trim();
  if (txt !== 'EXCLUIR' || pw.length < 3){
    alert('Confirmação inválida ou senha muito curta.'); return;
  }
  const in7d = Date.now() + 7*24*60*60*1000;
  saveLocal(K.ERASE, { scheduledAt: in7d });
  eraseModal.hidden = true;
  hydrate();
  alert('Exclusão agendada. Você pode cancelar até a data informada.');
});

$('#btnEraseCancel')?.addEventListener('click', ()=>{
  saveLocal(K.ERASE, {});
  hydrate();
  alert('Exclusão cancelada.');
});
