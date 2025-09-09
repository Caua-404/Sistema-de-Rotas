import { $, saveLocal, readLocal } from './_utils.js';

/* ---------- util ---------- */
const statusEl = $('#notifStatus');
const setStatus = (t) => { if (statusEl) statusEl.textContent = t || ''; };

/* ---------- permission helpers ---------- */
async function ensurePushPermission(){
  if (!('Notification' in window)) {
    setStatus('Seu navegador não suporta notificações.');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied'){
    setStatus('Permissão negada no navegador. Altere nas configurações do site.');
    return false;
  }
  try{
    const perm = await Notification.requestPermission();
    if (perm === 'granted') return true;
    setStatus('Permissão não concedida.');
    return false;
  }catch{
    setStatus('Não foi possível solicitar permissão.');
    return false;
  }
}

/* ---------- coleta e aplicação ---------- */
function collect(){
  return {
    email:        $('#notifEmail')?.checked || false,
    push:         $('#notifPush')?.checked || false,
    sound:        $('#notifSound')?.checked || false,
    vibrate:      $('#notifVibrate')?.checked || false,
    requireInteract: $('#notifRequireInteract')?.checked || false,

    topics: {
      orders:    $('#topicOrders')?.checked || false,
      status:    $('#topicStatus')?.checked || false,
      security:  $('#topicSecurity')?.checked || false,
      marketing: $('#topicMarketing')?.checked || false,
    },

    frequency:    $('#notifFrequency')?.value || 'immediate',

    quiet: {
      enabled:   $('#quietEnabled')?.checked || false,
      start:     $('#quietStart')?.value || '22:00',
      end:       $('#quietEnd')?.value   || '07:00',
    }
  };
}

function applyToUI(prefs){
  // (front-end não precisa aplicar nada global além de persistir;
  //  aqui poderíamos plugar um badge/indicador, se necessário)
  setStatus('');
}

/* ---------- persistência ---------- */
function persist(prefs){
  saveLocal('mr_notif', prefs);
}

/* ---------- horário silencioso helper ---------- */
function isQuietNow(quiet){
  if (!quiet?.enabled) return false;
  const [sh, sm] = (quiet.start || '22:00').split(':').map(n=>+n);
  const [eh, em] = (quiet.end   || '07:00').split(':').map(n=>+n);
  const now = new Date();
  const mins = now.getHours()*60 + now.getMinutes();
  const start = sh*60 + sm;
  const end   = eh*60 + em;
  // período pode cruzar meia-noite
  return start <= end ? (mins >= start && mins <= end) : (mins >= start || mins <= end);
}

/* ---------- teste de notificação ---------- */
function playBeep(){
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 880;
    o.connect(g); g.connect(ctx.destination); g.gain.value = 0.05;
    o.start(); setTimeout(()=>{ o.stop(); ctx.close(); }, 180);
  } catch {}
}

async function sendTest(){
  const prefs = collect();

  if (prefs.push){
    const ok = await ensurePushPermission();
    if (!ok) { $('#notifPush').checked = false; persist(collect()); return; }
  }

  const suppressed = isQuietNow(prefs.quiet) && !prefs.topics.security;
  if (suppressed){
    setStatus('Silenciada pelo horário silencioso.');
  } else if (prefs.push && 'Notification' in window && Notification.permission === 'granted'){
    const n = new Notification('Moto Rota — Notificação de teste', {
      body: 'Este é um exemplo de push local.',
      requireInteraction: !!prefs.requireInteract,
      silent: !(prefs.sound || prefs.vibrate),
      tag: 'mr-test',
    });
    if (prefs.vibrate && 'vibrate' in navigator) navigator.vibrate?.(120);
    if (prefs.sound) playBeep();
    setStatus('Push enviada.');
    n.onclick = ()=> { window.focus(); n.close(); };
  } else if (prefs.email){
    setStatus('Seria enviado um e-mail (mock).');
  } else {
    setStatus('Nenhum canal ativo.');
  }
}

/* ---------- eventos ---------- */
$('#notifPush')?.addEventListener('change', async (e)=>{
  if (e.target.checked){
    const ok = await ensurePushPermission();
    if (!ok) { e.target.checked = false; setStatus('Push desativado (sem permissão).'); }
  }
});

$('#btnTestNotif')?.addEventListener('click', sendTest);

$('#btnSaveNotif')?.addEventListener('click', ()=>{
  const prefs = collect(); persist(prefs); applyToUI(prefs);
  setStatus('Preferências salvas!');
});

$('#btnResetNotif')?.addEventListener('click', ()=>{
  const defaults = {
    email:true, push:false, sound:false, vibrate:false, requireInteract:false,
    topics:{ orders:true, status:true, security:true, marketing:false },
    frequency:'immediate',
    quiet:{ enabled:true, start:'22:00', end:'07:00' }
  };
  // aplicar nos inputs
  $('#notifEmail').checked = defaults.email;
  $('#notifPush').checked  = defaults.push;
  $('#notifSound').checked = defaults.sound;
  $('#notifVibrate').checked = defaults.vibrate;
  $('#notifRequireInteract').checked = defaults.requireInteract;

  $('#topicOrders').checked   = defaults.topics.orders;
  $('#topicStatus').checked   = defaults.topics.status;
  $('#topicSecurity').checked = defaults.topics.security;
  $('#topicMarketing').checked= defaults.topics.marketing;

  $('#notifFrequency').value = defaults.frequency;

  $('#quietEnabled').checked = defaults.quiet.enabled;
  $('#quietStart').value     = defaults.quiet.start;
  $('#quietEnd').value       = defaults.quiet.end;

  persist(defaults);
  applyToUI(defaults);
  setStatus('Padrões restaurados.');
});

/* ---------- init ---------- */
(function hydrate(){
  const d = readLocal('mr_notif');
  if (!d) { applyToUI(collect()); return; }

  $('#notifEmail').checked = !!d.email;
  $('#notifPush').checked  = !!d.push;
  $('#notifSound').checked = !!d.sound;
  $('#notifVibrate').checked = !!d.vibrate;
  $('#notifRequireInteract').checked = !!d.requireInteract;

  $('#topicOrders').checked   = !!d.topics?.orders;
  $('#topicStatus').checked   = !!d.topics?.status;
  $('#topicSecurity').checked = !!d.topics?.security;
  $('#topicMarketing').checked= !!d.topics?.marketing;

  $('#notifFrequency').value = d.frequency || 'immediate';

  $('#quietEnabled').checked = !!d.quiet?.enabled;
  $('#quietStart').value     = d.quiet?.start || '22:00';
  $('#quietEnd').value       = d.quiet?.end   || '07:00';

  applyToUI(d);
})();
