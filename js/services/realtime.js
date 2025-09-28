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
