export function costFor(delivery){ return Number((delivery.km * delivery.priceKm).toFixed(2)); }
export function sumCosts(deliveries){ return Number(deliveries.reduce((a,d)=>a+costFor(d),0).toFixed(2)); }
