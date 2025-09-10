// JS/utils/dom.js
export const $ = (sel, el=document) => el.querySelector(sel);
export const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];
export const on = (el, ev, selOrFn, fn) => {
  if (typeof selOrFn === 'function') { el.addEventListener(ev, selOrFn); return; }
  el.addEventListener(ev, e => {
    const t = e.target.closest(selOrFn);
    if (t && el.contains(t)) fn(e, t);
  });
};
export const html = (strings, ...vals) => {
  const tpl = document.createElement('template');
  tpl.innerHTML = strings.reduce((s, str, i) => s + str + (vals[i] ?? ''), '');
  return tpl.content;
};
