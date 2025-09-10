// helpers compartilhados
export const $  = (s, el=document) => el.querySelector(s);
export const $$ = (s, el=document) => [...el.querySelectorAll(s)];
export const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

// máscaras simples (sem libs)
export const onlyDigits = v => (v||'').replace(/\D+/g,'');
export const maskCPF = v => {
  v = onlyDigits(v).slice(0,11);
  return v.replace(/^(\d{3})(\d)/, '$1.$2')
          .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, '$1.$2.$3-$4');
};
export const maskCNPJ = v => {
  v = onlyDigits(v).slice(0,14);
  return v.replace(/^(\d{2})(\d)/, '$1.$2')
          .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
          .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2}).*/, '$1.$2.$3/$4-$5');
};
export const maskCEP = v => {
  v = onlyDigits(v).slice(0,8);
  return v.replace(/^(\d{5})(\d{1,3}).*/, '$1-$2');
};
export const maskPhone = v => {
  v = onlyDigits(v).slice(0,11);
  return v.replace(/^(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d{1,4}).*/, '$1-$2');
};

// persistência local (mock)
export const saveLocal = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
export const readLocal = (k, d=null) => {
  try { const v = JSON.parse(localStorage.getItem(k)||'null'); return v ?? d; } catch { return d; }
};
