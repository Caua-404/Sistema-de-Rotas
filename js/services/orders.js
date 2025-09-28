if(!window.MR_ORDERS){
  const LS = 'mr_orders';
  const load = ()=> JSON.parse(localStorage.getItem(LS)||'[]');
  const save = (arr)=> localStorage.setItem(LS, JSON.stringify(arr));
  const code = ()=> Math.random().toString(36).slice(2,7).toUpperCase();

  function createOrder({ restaurantId, items, address, payment }){
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    const order = {
      id, code: code(), restaurantId, items, address, payment,
      status:'created',
      courierLoc: [-23.56, -46.66],
      destination: [-23.565, -46.64],
      createdAt: Date.now()
    };
    const arr = load(); arr.push(order); save(arr);
    // Inicia simulação de timeline
    setTimeout(()=>updateStatus(id,'preparing'), 2000);
    setTimeout(()=>updateStatus(id,'pickup'), 8000);
    setTimeout(()=>updateStatus(id,'enroute'), 12000);
    setTimeout(()=>updateStatus(id,'delivered'), 22000);
    return order;
  }
  function updateStatus(id, status){
    const arr = load(); const o = arr.find(x=>x.id===id); if(!o) return;
    o.status = status; save(arr);
    window.MR_REALTIME.emit(id, { type:'STATUS', status });
  }
  function get(id){ return load().find(x=>x.id===id); }

  function mockJob(){
    return {
      id: 'job_'+code(), code: code(),
      pickupName: 'Restaurante',
      dropName: 'Cliente',
      pickup: [-23.56, -46.66],
      drop: [-23.565, -46.64],
      distanceKm: 2.1
    };
  }
  function acceptJob(id){ console.log('Aceitou corrida', id); }

  window.MR_ORDERS = { createOrder, updateStatus, get, mockJob, acceptJob };
}
