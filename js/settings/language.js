import { $, saveLocal, readLocal } from './_utils.js';

/* ===== elementos ===== */
const selLang = $('#lang');
const selCurr = $('#currency');
const selTz   = $('#tz');
const selDir  = $('#dirMode');

const btnSave   = $('#btnSaveLang');
const btnDetect = $('#btnDetectLocale');

const elHello = $('#i18nHello');
const elToday = $('#i18nToday');
const elDate  = $('#i18nDate');
const elNum   = $('#i18nNumber');
const elPrice = $('#i18nPrice');

/* ===== mini dicionário (exemplo) ===== */
const DICTS = {
  'pt-BR': { hello:'Olá',  today:'Hoje é' },
  'es-ES': { hello:'Hola', today:'Hoy es' },
  'en-US': { hello:'Hello', today:'Today is' },
};
const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur']);

/* ===== aplica direção e lang no <html> ===== */
function applyHtmlLangDir(lang, dirMode){
  const html = document.documentElement;
  html.lang = lang || 'pt-BR';
  if (dirMode === 'ltr' || dirMode === 'rtl'){
    html.dir = dirMode;
  } else {
    const base = (lang || '').split('-')[0];
    html.dir = RTL_LANGS.has(base) ? 'rtl' : 'ltr';
  }
}

/* ===== preview usando Intl ===== */
function updatePreview(){
  const lang = selLang?.value || 'pt-BR';
  const curr = selCurr?.value || 'BRL';

  const dict = DICTS[lang] || DICTS['pt-BR'];
  if (elHello) elHello.textContent = dict.hello;
  if (elToday) elToday.textContent = dict.today;

  const now = new Date();
  const fmtDate = new Intl.DateTimeFormat(lang, { dateStyle:'full', timeStyle:'short' });
  const fmtNum  = new Intl.NumberFormat(lang, { maximumFractionDigits:2 });
  const fmtCur  = new Intl.NumberFormat(lang, { style:'currency', currency: curr });

  if (elDate)  elDate.textContent  = fmtDate.format(now);
  if (elNum)   elNum.textContent   = fmtNum.format(1234567.89);
  if (elPrice) elPrice.textContent = fmtCur.format(199.9);
}

/* ===== salvar & carregar ===== */
function persist(){
  const data = {
    lang: selLang?.value || 'pt-BR',
    currency: selCurr?.value || 'BRL',
    tz: selTz?.value || 'America/Belem',
    dirMode: selDir?.value || 'auto',
  };
  saveLocal('mr_locale', data);

  applyHtmlLangDir(data.lang, data.dirMode);
  try { localStorage.setItem('mr_currency', data.currency); } catch {}
  try { localStorage.setItem('mr_tz', data.tz); } catch {}
}

function hydrate(){
  const d = readLocal('mr_locale');
  if (!d) {
    applyHtmlLangDir(selLang?.value || 'pt-BR', 'auto');
    updatePreview();
    return;
  }
  if (selLang) selLang.value = d.lang || 'pt-BR';
  if (selCurr) selCurr.value = d.currency || 'BRL';
  if (selTz)   selTz.value   = d.tz || 'America/Belem';
  if (selDir)  selDir.value  = d.dirMode || 'auto';

  applyHtmlLangDir(d.lang, d.dirMode);
  updatePreview();
}

/* ===== eventos ===== */
selLang && selLang.addEventListener('change', updatePreview);
selCurr && selCurr.addEventListener('change', updatePreview);
selDir  && selDir.addEventListener('change', ()=> applyHtmlLangDir(selLang.value, selDir.value));

btnDetect && btnDetect.addEventListener('click', ()=>{
  const navLang = navigator.language || 'pt-BR';
  if (selLang) selLang.value = navLang;
  const guessCurrency = (l)=>{
    const base = l.split('-')[1] || l.split('-')[0] || 'BR';
    if (base === 'US' || base === 'GB') return 'USD';
    if (base === 'ES' || base === 'PT') return 'EUR';
    if (base === 'BR') return 'BRL';
    return 'USD';
  };
  if (selCurr) selCurr.value = guessCurrency(navLang);
  updatePreview();
});

btnSave && btnSave.addEventListener('click', ()=>{
  persist();
  alert('Idioma e formatos aplicados!');
});

/* init */
hydrate();
