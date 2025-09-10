import { $, on, saveLocal, readLocal } from './_utils.js';

/* --------- helpers --------- */
const strength = (s='')=>{
  let score = 0;
  if (s.length >= 8) score++;
  if (/[a-z]/.test(s)) score++;
  if (/[A-Z]/.test(s)) score++;
  if (/\d/.test(s))    score++;
  if (/[^A-Za-z0-9]/.test(s)) score++;
  return Math.min(score, 5);
};
const setMeter = (score)=>{
  const bar = $('#pwBar'); const lbl = $('#pwLabel');
  if (!bar || !lbl) return;
  const widths = ['0%','20%','40%','60%','80%','100%'];
  const labels = ['—','Muito fraca','Fraca','Média','Forte','Excelente'];
  const colors = ['var(--danger)','var(--danger)','var(--warn)','var(--ok)','var(--ok)','var(--primary)'];
  bar.style.width = widths[score];
  bar.style.background = colors[score];
  lbl.textContent = labels[score];
};

/* --------- troca de senha (mock) --------- */
on($('#newPass'), 'input', e => setMeter(strength(e.target.value)));
on($('#btnUpdateSecurity'), 'click', ()=>{
  const curr = $('#currPass')?.value || '';
  const n1 = $('#newPass')?.value || '';
  const n2 = $('#newPass2')?.value || '';
  if (!n1 || n1 !== n2 || strength(n1) < 4){
    alert('Verifique a nova senha (atenda aos requisitos e confirme corretamente).');
    return;
  }
  // mock: apenas alerta; backend deverá validar reautenticação e atualizar hash
  alert('Senha atualizada (mock).');
});

/* --------- 2FA (mock TOTP) --------- */
const twofa = $('#twofa');
const trusted = $('#trusted');
const setupBox = $('#twofaSetup');
const qrBox = $('#qrBox');
const secretEl = $('#totpSecret');
const copySecretBtn = $('#copySecret');
const btnGenBackup = $('#btnGenBackup');
const btnShowBackup = $('#btnShowBackup');

function randomBase32(len=16){
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  return Array.from({length: len}, ()=> alphabet[Math.floor(Math.random()*alphabet.length)]).join('');
}
function buildOtpUri(secret, label='MotoRota:usuario', issuer='MotoRota'){
  const p = new URLSearchParams({ secret, issuer });
  return `otpauth://totp/${encodeURIComponent(label)}?${p.toString()}`;
}
function renderQRPlaceholder(uri){
  // placeholder (sem dependências): exibe URI truncada como “QR”
  qrBox.innerHTML = `<div style="font-size:.8rem;padding:.5rem">${uri.replace(/.{36}..*/, '$&…')}</div>`;
}

function enable2FA(){
  const secret = randomBase32(20);
  secretEl.textContent = secret;
  setupBox.hidden = false;
  renderQRPlaceholder(buildOtpUri(secret));
  btnShowBackup.disabled = false;
  saveLocal('mr_2fa', { enabled:true, secret, trusted: !!trusted?.checked });
}
function disable2FA(){
  setupBox.hidden = true;
  secretEl.textContent = '—';
  btnShowBackup.disabled = true;
  saveLocal('mr_2fa', { enabled:false, secret:null, trusted:false });
}
on(twofa, 'change', ()=> twofa.checked ? enable2FA() : disable2FA());
on(trusted, 'change', ()=>{
  const d = readLocal('mr_2fa') || {};
  d.trusted = !!trusted.checked;
  saveLocal('mr_2fa', d);
});

/* --------- códigos de backup (modal) --------- */
const modal = $('#backupModal');
const list  = $('#backupList');
const btnCopy = $('#btnCopyBackup');
const btnDownload = $('#btnDownloadBackup');
const btnClose = $('#btnCloseBackup');

function genCodes(n=10){
  const codes = [];
  for (let i=0;i<n;i++){
    const part = ()=> Math.random().toString(36).slice(2,6).toUpperCase();
    codes.push(`${part()}-${part()}-${part()}`);
  }
  return codes;
}
on(btnGenBackup, 'click', ()=>{
  const codes = genCodes(10);
  saveLocal('mr_2fa_backup', codes);
  alert('Códigos gerados! Guarde-os em local seguro.');
  btnShowBackup.disabled = false;
});

on(btnShowBackup, 'click', ()=>{
  const codes = readLocal('mr_2fa_backup') || [];
  list.innerHTML = codes.map(c=>`<li>${c}</li>`).join('');
  modal.hidden = false;
});
on(btnClose, 'click', ()=> modal.hidden = true);
on(modal, 'click', (e)=> { if (e.target === modal) modal.hidden = true; });

on(btnCopy, 'click', async ()=>{
  const codes = [...list.querySelectorAll('li')].map(li=>li.textContent).join('\n');
  try { await navigator.clipboard.writeText(codes); alert('Copiado!'); } catch { alert('Não foi possível copiar.'); }
});
on(btnDownload, 'click', ()=>{
  const codes = [...list.querySelectorAll('li')].map(li=>li.textContent).join('\n');
  const blob = new Blob([codes], {type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'moto-rota-backup-codes.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
});

/* --------- alertas & allow list --------- */
const alertNewDevice = $('#alertNewDevice');
const alertPasswordChange = $('#alertPasswordChange');
const allowList = $('#allowList');
on($('#btnSaveSecPrefs'), 'click', ()=>{
  saveLocal('mr_sec_prefs', {
    alertNewDevice: !!alertNewDevice?.checked,
    alertPasswordChange: !!alertPasswordChange?.checked,
    allowList: allowList?.value || ''
  });
  alert('Preferências de segurança salvas!');
});

/* --------- hydrate inicial --------- */
(function hydrate(){
  // 2FA
  const two = readLocal('mr_2fa');
  if (two?.enabled){ if (twofa) twofa.checked = true; enable2FA(); }
  if (trusted && two) trusted.checked = !!two.trusted;

  // backup
  const backups = readLocal('mr_2fa_backup');
  if (backups?.length) btnShowBackup.disabled = false;

  // prefs
  const p = readLocal('mr_sec_prefs');
  if (p){
    if (alertNewDevice) alertNewDevice.checked = !!p.alertNewDevice;
    if (alertPasswordChange) alertPasswordChange.checked = !!p.alertPasswordChange;
    if (allowList) allowList.value = p.allowList || '';
  }
})();
