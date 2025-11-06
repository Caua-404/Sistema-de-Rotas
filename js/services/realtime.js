<<<<<<< HEAD
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
=======
if(!window.MR_REALTIME){
  const listeners = new Map();
  function subscribe(orderId, cb){
    if(!listeners.has(orderId)) listeners.set(orderId, new Set());
    listeners.get(orderId).add(cb);
    // Simula atualização de posição
    let t = 0;
    const id = setInterval(()=>{
      t += 1;
      const pos = [-23.56 + t*0.0004, -46.66 + t*0.0009];
      emit(orderId, { type:'LOCATION', position: pos });
      if(t>30){ clearInterval(id); }
    }, 1000);
    return ()=>{ listeners.get(orderId)?.delete(cb); };
  }
  function emit(orderId, payload){
    listeners.get(orderId)?.forEach(fn=>fn(payload));
  }
  window.MR_REALTIME = { subscribe, emit };
}
>>>>>>> 9b603892dc046c93a613b280bc65efc0466ebb5a
