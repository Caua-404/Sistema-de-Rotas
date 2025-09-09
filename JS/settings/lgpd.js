import { $, saveLocal, readLocal } from './_utils.js';

/* keys */
const K = {
  CK: 'mr_cookie_consent',     // { functional, analytics, marketing }
  LGPD: 'mr_lgpd_purposes',    // { ops, perso, analyt, mkt }
  LOG: 'mr_consent_log'        // [ { purpose, status:'granted'|'revoked', at, source } ]
};

function fmt(ts){
  const lang = (readLocal('mr_locale')?.lang) || 'pt-BR';
  return new Intl.DateTimeFormat(lang, { dateStyle:'medium', timeStyle:'short' }).format(ts);
}

function pushLog(purpose, status, source='settings'){
  const log = readLocal(K.LOG) || [];
  log.unshift({ purpose, status, at: Date.now(), source });
  saveLocal(K.LOG, log.slice(0, 200)); // limite simples
}

function renderLog(){
  const tbody = $('#consentBody'); if (!tbody) return;
  const log = readLocal(K.LOG) || [];
  tbody.innerHTML = log.map(r => `
    <tr>
      <td>${r.purpose}</td>
      <td>${r.status === 'granted' ? 'Concedido' : 'Revogado'}</td>
      <td>${fmt(r.at)}</td>
      <td>${r.source}</td>
    </tr>
  `).join('') || `<tr><td colspan="4">Nenhum registro.</td></tr>`;
}

function hydrate(){
  // cookies
  const ck = readLocal(K.CK) || { functional:true, analytics:true, marketing:false };
  $('#ckFunctional').checked = !!ck.functional;
  $('#ckAnalytics').checked  = !!ck.analytics;
  $('#ckMarketing').checked  = !!ck.marketing;

  // purposes
  const p = readLocal(K.LGPD) || { ops:true, perso:true, analyt:true, mkt:false };
  $('#consOps').checked   = !!p.ops;
  $('#consPerso').checked = !!p.perso;
  $('#consAnalyt').checked= !!p.analyt;
  $('#consMkt').checked   = !!p.mkt;

  renderLog();
}
hydrate();

/* salvar */
$('#btnSaveLgpd')?.addEventListener('click', ()=>{
  const ck = {
    functional: !!$('#ckFunctional')?.checked,
    analytics:  !!$('#ckAnalytics')?.checked,
    marketing:  !!$('#ckMarketing')?.checked
  };
  const p = {
    ops:   !!$('#consOps')?.checked,
    perso: !!$('#consPerso')?.checked,
    analyt:!!$('#consAnalyt')?.checked,
    mkt:   !!$('#consMkt')?.checked
  };

  // log de mudanças (por finalidade)
  const prev = readLocal(K.LGPD) || {};
  const map = { ops:'Operação', perso:'Personalização', analyt:'Mensuração', mkt:'Marketing' };
  Object.keys(p).forEach(k=>{
    if (prev[k] !== undefined && prev[k] !== p[k]){
      pushLog(map[k], p[k] ? 'granted' : 'revoked');
    }
  });

  saveLocal(K.CK, ck);
  saveLocal(K.LGPD, p);
  renderLog();
  alert('Consentimentos salvos!');
});

/* revogar todos */
$('#btnRevokeAll')?.addEventListener('click', ()=>{
  // uncheck toggles (exceto essenciais/funcionais se desejar manter)
  $('#ckAnalytics').checked = false;
  $('#ckMarketing').checked = false;

  $('#consOps').checked = true; // geralmente operação é base legal legítima
  $('#consPerso').checked = false;
  $('#consAnalyt').checked = false;
  $('#consMkt').checked = false;

  // grava e loga
  saveLocal(K.CK, { functional:true, analytics:false, marketing:false });
  saveLocal(K.LGPD, { ops:true, perso:false, analyt:false, mkt:false });

  pushLog('Personalização', 'revoked');
  pushLog('Mensuração', 'revoked');
  pushLog('Marketing', 'revoked');

  renderLog();
  alert('Todos os consentimentos opcionais foram revogados.');
});
