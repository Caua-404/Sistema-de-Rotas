// js/services/realtime.js
const ch = new BroadcastChannel('mr_bus');

export const Realtime = {
  send(topic, payload){ ch.postMessage({ topic, payload }); },
  on(topic, fn){
    const h = ev => { if (ev.data?.topic === topic) fn(ev.data.payload); };
    ch.addEventListener('message', h);
    return () => ch.removeEventListener('message', h);
  }
};
