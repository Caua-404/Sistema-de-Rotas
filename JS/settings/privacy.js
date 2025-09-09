import { $, saveLocal, readLocal } from './_utils.js';

/* -------- helpers -------- */
const defPrefs = {
  shareLocation: false,
  locationAccuracy: 'approx',
  locationDuration: 'off',
  showStatus: true,
  readReceipts: true,
  discoverByEmail: false,
  analytics: true,
  crash: true,
  personalize: true,
  blocks: [],
  scopesRevoked: []
};

function collect(){
  return {
    shareLocation:   $('#pvShareLocation')?.checked || false,
    locationAccuracy:$('#pvLocationAccuracy')?.value || 'approx',
    locationDuration:$('#pvLocationDuration')?.value || 'off',

    showStatus:      $('#pvShowStatus')?.checked || false,
    readReceipts:    $('#pvReadReceipts')?.checked || false,
    discoverByEmail: $('#pvDiscoverByEmail')?.checked || false,

    analytics:       $('#pvAnalytics')?.checked || false,
    crash:           $('#pvCrash')?.checked || false,
    personalize:     $('#pvPersonalize')?.checked || false,

    blocks:          [...document.querySelectorAll('#pvBlockList li[data-id]')].map(li=>li.dataset.id),
    scopesRevoked:   JSON.parse(localStorage.getItem('mr_priv_scopes_revoked') || '[]')
  };
}

function paintBlocks(list){
  const ul = $('#pvBlockList'); if (!ul) return;
  ul.innerHTML = (list || []).map(id => `
    <li class="list-group-item" data-id="${id}">
      <span>${id}</span>
      <button class="btn btn--ghost btn-sm" type="button" data-unblock="${id}">Desbloquear</button>
    </li>`).join('');
}

/* -------- hydrate -------- */
(function hydrate(){
  const d = Object.assign({}, defPrefs, readLocal('mr_privacy') || {});

  $('#pvShareLocation').checked     = !!d.shareLocation;
  $('#pvLocationAccuracy').value    = d.locationAccuracy;
  $('#pvLocationDuration').value    = d.locationDuration;

  $('#pvShowStatus').checked        = !!d.showStatus;
  $('#pvReadReceipts').checked      = !!d.readReceipts;
  $('#pvDiscoverByEmail').checked   = !!d.discoverByEmail;

  $('#pvAnalytics').checked         = !!d.analytics;
  $('#pvCrash').checked             = !!d.crash;
  $('#pvPersonalize').checked       = !!d.personalize;

  paintBlocks(d.blocks);
})();

/* -------- eventos: blocklist -------- */
$('#pvBlockAdd')?.addEventListener('click', ()=>{
  const inp = $('#pvBlockInput'); if (!inp) return;
  const val = (inp.value || '').trim();
  if (!val) return;
  const current = [...document.querySelectorAll('#pvBlockList li[data-id]')].map(li=>li.dataset.id);
  if (!current.includes(val)) current.push(val);
  paintBlocks(current);
  inp.value = '';
});

$('#pvBlockClear')?.addEventListener('click', ()=>{
  paintBlocks([]);
});

$('#pvBlockList')?.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-unblock]');
  if (!btn) return;
  const id = btn.getAttribute('data-unblock');
  const rest = [...document.querySelectorAll('#pvBlockList li[data-id]')].map(li=>li.dataset.id).filter(x=>x !== id);
  paintBlocks(rest);
});

/* -------- eventos: revogar escopos (mock) -------- */
$('#pvScopes')?.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-scope]');
  if (!btn) return;
  const id = btn.getAttribute('data-scope');
  const revoked = new Set(JSON.parse(localStorage.getItem('mr_priv_scopes_revoked') || '[]'));
  if (revoked.has(id)) {
    revoked.delete(id);
    btn.textContent = 'Revogar';
  } else {
    revoked.add(id);
    btn.textContent = 'Reativar';
  }
  localStorage.setItem('mr_priv_scopes_revoked', JSON.stringify([...revoked]));
});

/* -------- salvar / reset -------- */
$('#btnSavePrivacy')?.addEventListener('click', ()=>{
  const prefs = collect();
  saveLocal('mr_privacy', prefs);

  // localização (mock): aqui você chamaria o backend/GPS
  if (!prefs.shareLocation){
    // parar qualquer watcher de geolocalização, se existisse
    console.log('[Privacidade] Localização em tempo real: DESLIGADA');
  } else {
    console.log('[Privacidade] Localização LIGADA:', prefs.locationAccuracy, prefs.locationDuration);
  }

  alert('Preferências de privacidade salvas!');
});

$('#btnResetPrivacy')?.addEventListener('click', ()=>{
  saveLocal('mr_privacy', defPrefs);
  localStorage.removeItem('mr_priv_scopes_revoked');

  // reset UI
  $('#pvShareLocation').checked   = defPrefs.shareLocation;
  $('#pvLocationAccuracy').value  = defPrefs.locationAccuracy;
  $('#pvLocationDuration').value  = defPrefs.locationDuration;

  $('#pvShowStatus').checked      = defPrefs.showStatus;
  $('#pvReadReceipts').checked    = defPrefs.readReceipts;
  $('#pvDiscoverByEmail').checked = defPrefs.discoverByEmail;

  $('#pvAnalytics').checked       = defPrefs.analytics;
  $('#pvCrash').checked           = defPrefs.crash;
  $('#pvPersonalize').checked     = defPrefs.personalize;

  paintBlocks(defPrefs.blocks);
  // reset botões de escopo
  document.querySelectorAll('#pvScopes button[data-scope]').forEach(b => b.textContent = 'Revogar');

  alert('Privacidade revertida para padrão.');
});
