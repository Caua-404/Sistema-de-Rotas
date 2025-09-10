import { $, $$, saveLocal, readLocal } from './_utils.js';

/* ===== helpers ===== */
const root = document.documentElement;
const setVar = (k,v) => root.style.setProperty(k, v);
const darker = (hex, pct=0.18) => {
  const n = hex.replace('#','');
  const parts = n.length===3 ? n.split('').map(c=>c+c) : [n.slice(0,2), n.slice(2,4), n.slice(4,6)];
  const [r,g,b] = parts.map(x=>Math.max(0, Math.min(255, Math.round(parseInt(x,16)*(1-pct)))));
  return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
};

/* ===== aplicar opções ===== */
function applyAccent(hex){
  if (!hex) return;
  setVar('--primary', hex);
  setVar('--bs-primary', hex);
  setVar('--primary-600', darker(hex, .18));
  // links da grade de settings
  document.querySelectorAll('.settings__grid a.tile').forEach(a => { a.style.color = hex; });
}
function applyDensity(val){
  if (val === 'compact'){
    setVar('--space-1','.35rem'); setVar('--space-2','.55rem'); setVar('--space-3','.8rem');
    setVar('--space-4','1rem');   setVar('--space-5','1.5rem');
  } else {
    setVar('--space-1','.5rem');  setVar('--space-2','.75rem'); setVar('--space-3','1rem');
    setVar('--space-4','1.25rem');setVar('--space-5','2rem');
  }
}
function applyRadius(val){
  if (val === 'square'){ setVar('--radius','6px');  setVar('--radius-lg','10px'); }
  else if (val === 'round'){ setVar('--radius','16px'); setVar('--radius-lg','20px'); }
  else { setVar('--radius','12px'); setVar('--radius-lg','16px'); }
}
function applyElevation(val){
  if (val === 'low'){  setVar('--shadow-1','0 2px 6px rgba(0,0,0,.12)');  setVar('--shadow-2','0 6px 16px rgba(0,0,0,.16)'); }
  else if (val === 'high'){ setVar('--shadow-1','0 6px 18px rgba(0,0,0,.22)'); setVar('--shadow-2','0 16px 40px rgba(0,0,0,.28)'); }
  else { setVar('--shadow-1','0 4px 12px rgba(0,0,0,.18)'); setVar('--shadow-2','0 10px 28px rgba(0,0,0,.22)'); }
}

/* ===== persistência ===== */
function persist(){
  const data = {
    accent: getComputedStyle(root).getPropertyValue('--primary').trim() || '#FF5900',
    density: $('#density') ? $('#density').value : 'comfortable',
    radius: $('#radius') ? $('#radius').value : 'soft',
    elevation: $('#elevation') ? $('#elevation').value : 'normal'
  };
  saveLocal('mr_appearance', data);
}
function hydrate(){
  const d = readLocal('mr_appearance');
  if (d){
    // preencher selects/inputs
    if ($('#density'))  $('#density').value  = d.density || 'comfortable';
    if ($('#radius'))   $('#radius').value   = d.radius || 'soft';
    if ($('#elevation'))$('#elevation').value= d.elevation || 'normal';
    if ($('#accentPicker')) $('#accentPicker').value = d.accent || '#FF5900';
    // aplicar
    applyAccent(d.accent || '#FF5900');
    applyDensity(d.density || 'comfortable');
    applyRadius(d.radius || 'soft');
    applyElevation(d.elevation || 'normal');
  } else {
    // aplicar defaults do HTML se nada salvo
    applyAccent($('#accentPicker') ? $('#accentPicker').value : '#FF5900');
    applyDensity($('#density') ? $('#density').value : 'comfortable');
    applyRadius($('#radius') ? $('#radius').value : 'soft');
    applyElevation($('#elevation') ? $('#elevation').value : 'normal');
  }
}

/* ===== eventos ===== */
// tema (claro/escuro/sistema)
$$('[data-theme]').forEach(btn => {
  btn.addEventListener('click', () => {
    const t = btn.getAttribute('data-theme');
    if (t === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-bs-theme', prefersDark ? 'dark' : 'light');
      try { localStorage.removeItem('mr_theme'); } catch {}
      if (window.__setMapTheme__) window.__setMapTheme__(prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-bs-theme', t);
      try { localStorage.setItem('mr_theme', t); } catch {}
      if (window.__setMapTheme__) window.__setMapTheme__(t);
    }
  });
});

// cor de destaque
$$('.swatch[data-accent]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const hex = btn.getAttribute('data-accent');
    applyAccent(hex);
    if ($('#accentPicker')) $('#accentPicker').value = hex;
  });
});
$('#accentPicker') && $('#accentPicker').addEventListener('input', e => applyAccent(e.target.value));

// densidade / cantos / elevação (aplicação imediata)
$('#density')   && $('#density').addEventListener('change', e => applyDensity(e.target.value));
$('#radius')    && $('#radius').addEventListener('change', e => applyRadius(e.target.value));
$('#elevation') && $('#elevation').addEventListener('change', e => applyElevation(e.target.value));

// salvar/aplicar
$('#btnSaveAppearance') && $('#btnSaveAppearance').addEventListener('click', ()=>{
  persist();
  alert('Aparência aplicada!');
});

// reset para padrão
$('#btnResetAppearance') && $('#btnResetAppearance').addEventListener('click', ()=>{
  // valores padrão do tema delivery
  const defaults = { accent:'#FF5900', density:'comfortable', radius:'soft', elevation:'normal' };

  if ($('#accentPicker')) $('#accentPicker').value = defaults.accent;
  if ($('#density'))      $('#density').value      = defaults.density;
  if ($('#radius'))       $('#radius').value       = defaults.radius;
  if ($('#elevation'))    $('#elevation').value    = defaults.elevation;

  applyAccent(defaults.accent);
  applyDensity(defaults.density);
  applyRadius(defaults.radius);
  applyElevation(defaults.elevation);

  // limpa persistência
  try { localStorage.removeItem('mr_appearance'); } catch {}
  alert('Aparência revertida para o padrão.');
});

/* ===== init ===== */
hydrate();