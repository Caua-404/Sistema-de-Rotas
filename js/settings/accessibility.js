import { $, saveLocal, readLocal } from './_utils.js';

function applyAcc(settings){
  const root = document.documentElement;

  root.dataset.accContrast   = settings.contrast   || 'normal';
  root.dataset.accFontsize   = settings.fontSize   || 'normal';
  root.dataset.accLinespacing= settings.lineSpacing|| 'normal';
  root.dataset.accReadable   = settings.readable   ? 'true' : 'false';
  root.dataset.accColorblind = settings.colorBlind || 'none';
  root.dataset.accKeyboard   = settings.keyboard   ? 'true' : 'false';

  if (settings.reduceMotion){
    root.style.setProperty('scroll-behavior','auto');
    document.body.classList.add('reduce-motion');
  } else {
    root.style.removeProperty('scroll-behavior');
    document.body.classList.remove('reduce-motion');
  }
}

function collect(){
  return {
    contrast:   $('#accHighContrast')?.checked ? 'high' : 'normal',
    reduceMotion: $('#accReduceMotion')?.checked || false,
    fontSize:   $('#accFontSize')?.value || 'normal',
    lineSpacing: $('#accExtraSpacing')?.checked ? 'extra' : 'normal',
    readable:   $('#accReadableFont')?.checked || false,
    colorBlind: $('#accColorBlind')?.value || 'none',
    keyboard:   $('#accKeyboardNav')?.checked || false,
  };
}

function hydrate(){
  const s = readLocal('mr_access') || {};
  $('#accHighContrast').checked = s.contrast === 'high';
  $('#accReduceMotion').checked = !!s.reduceMotion;
  $('#accFontSize').value = s.fontSize || 'normal';
  $('#accExtraSpacing').checked = s.lineSpacing === 'extra';
  $('#accReadableFont').checked = !!s.readable;
  $('#accColorBlind').value = s.colorBlind || 'none';
  $('#accKeyboardNav').checked = !!s.keyboard;
  applyAcc(s);
}

/* eventos */
$('#btnSaveAcc')?.addEventListener('click', ()=>{
  const s = collect();
  saveLocal('mr_access', s);
  applyAcc(s);
  alert('Configurações de acessibilidade aplicadas!');
});

$('#btnResetAcc')?.addEventListener('click', ()=>{
  const defaults = {
    contrast:'normal', reduceMotion:false, fontSize:'normal',
    lineSpacing:'normal', readable:false, colorBlind:'none', keyboard:false
  };
  saveLocal('mr_access', defaults);
  applyAcc(defaults);
  hydrate();
  alert('Acessibilidade revertida para padrão.');
});

/* init */
hydrate();
