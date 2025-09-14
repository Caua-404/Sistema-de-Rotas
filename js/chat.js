/* Chat simples (mock) com persistência local */
const $ = (sel, el=document) => el.querySelector(sel);

const FAB   = $('#chatFab');
const PANEL = $('#chatPanel');
const CLOSE = $('#chatClose');
const LIST  = $('#chatList');
const FORM  = $('#chatForm');
const INPUT = $('#chatInput');

const STORE_KEY = 'mr_chat_thread';

function nowFmt(){
  try{
    const lang = (JSON.parse(localStorage.getItem('mr_locale')||'{}').lang) || 'pt-BR';
    return new Intl.DateTimeFormat(lang, { hour:'2-digit', minute:'2-digit' }).format(new Date());
  }catch(_){ return ''; }
}

function readThread(){
  try{
    const arr = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  }catch(_){ return []; }
}
function saveThread(arr){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(arr)); }catch(_){}
}

function render(){
  const msgs = readThread();
  LIST.innerHTML = msgs.map(m => `
    <li class="chat__msg ${m.from==='me' ? 'chat__msg--me' : ''}">
      <div>${m.text}</div>
      <div class="chat__meta">${m.time}</div>
    </li>
  `).join('');
  LIST.scrollTop = LIST.scrollHeight;
}

function openChat(){
  PANEL.classList.add('is-open');
  PANEL.setAttribute('aria-hidden','false');
  setTimeout(() => INPUT?.focus(), 50);
}
function closeChat(){
  PANEL.classList.remove('is-open');
  PANEL.setAttribute('aria-hidden','true');
}

FAB?.addEventListener('click', () => {
  if (PANEL.classList.contains('is-open')) closeChat();
  else openChat();
});
CLOSE?.addEventListener('click', closeChat);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeChat(); });

FORM?.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = (INPUT.value || '').trim();
  if (!text) return;

  const msgs = readThread();
  msgs.push({ from:'me', text, time: nowFmt() });
  saveThread(msgs);
  render();
  INPUT.value = '';

  // Resposta mock da "empresa"
  setTimeout(() => {
    const back = readThread();
    back.push({ from:'agent', text: 'Obrigado! Em que posso ajudar?', time: nowFmt() });
    saveThread(back);
    render();
  }, 600);
});

// thread de boas-vindas se vazio
(function seed(){
  const msgs = readThread();
  if (!msgs.length){
    saveThread([
      { from:'agent', text:'Olá! Bem-vindo ao atendimento Moto Rota.', time: nowFmt() },
      { from:'agent', text:'Envie sua mensagem para começar 🙂', time: nowFmt() }
    ]);
  }
  render();
})();
