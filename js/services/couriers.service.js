// js/services/couriers.service.js
import { Realtime } from './realtime.js';

export const CouriersService = {
  async nearby({ lat, lng }) {
    // MOCK — Em produção, GET /couriers/nearby?lat=...&lng=...
    return [
      { id:'c-01', name:'João', distKm: 1.2, fee: 10.0 },
      { id:'c-02', name:'Bia',  distKm: 2.7, fee: 12.5 },
      { id:'c-03', name:'Leo',  distKm: 3.1, fee: 11.0 }
    ];
  },

  // envia oferta para caixa do motoboy
  offerRide(order, courier) {
    Realtime.send(`inbox:${courier.id}`, {
      type:'OFFER',
      order: {
        id: order.id,
        from: order.pickup,
        to:   order.dropoff,
        total: order.total
      }
    });
  }
};
