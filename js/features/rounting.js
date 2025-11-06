/* Roteirização simples (vizinho mais próximo) — ponto de partida (lat,lng).
   Depois é só trocar por um serviço especializado (OSRM/Google/etc.) */
export function nearestNeighborRoute(start, waypoints){
  const path = [];
  const remaining = [...waypoints];
  let current = start;

  const dist = (a,b)=>Math.hypot(a.lat-b.lat, a.lng-b.lng);

  while(remaining.length){
    remaining.sort((p,q)=> dist(current,p) - dist(current,q));
    const next = remaining.shift();
    path.push(next);
    current = next;
  }
  return path; // ordem otimizada
}
