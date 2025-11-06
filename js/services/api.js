/* Camada de serviço — mock/local hoje, fácil trocar por fetch() amanhã */
const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

// Fallback simples do structuredClone (para navegadores antigos)
const clone = (obj) => (typeof structuredClone === 'function'
  ? structuredClone(obj)
  : JSON.parse(JSON.stringify(obj)));

const now = Date.now();

const DB = {
  deliveries: [
    // status: 'on' | 'done' | 'late'
    {
      id: 1243,
      client: 'Alexandre',
      courierId: 1,
      status: 'late',
      etaMin: 15,
      km: 8.2,
      priceKm: 2.8,
      createdAt: now - 60 * 60e3,
      startedAt: now - 40 * 60e3,
      finishedAt: null,
      address: 'Av. Paulista, 1000',
      token: 'trk-1243',
    },
    {
      id: 1244,
      client: 'Maria Souza',
      courierId: 2,
      status: 'done',
      etaMin: 0,
      km: 6.0,
      priceKm: 2.8,
      createdAt: now - 3 * 60 * 60e3,
      startedAt: now - 2.5 * 60 * 60e3,
      finishedAt: now - 2 * 60 * 60e3,
      address: 'Rua das Flores, 50',
      token: 'trk-1244',
    },
    {
      id: 1245,
      client: 'Ana Lima',
      courierId: 3,
      status: 'on',
      etaMin: 9,
      km: 4.7,
      priceKm: 2.8,
      createdAt: now - 30 * 60e3,
      startedAt: now - 22 * 60e3,
      finishedAt: null,
      address: 'Alameda Santos, 45',
      token: 'trk-1245',
    },
  ],
  couriers: [
    // availability: 'online' | 'offline' | 'busy'
    {
      id: 1,
      name: 'Lula',
      availability: 'busy',
      avatar: 'assets/user.jpg', // sem arquivo específico => fallback
      lat: -23.561,
      lng: -46.657,
    },
    {
      id: 2,
      name: 'Thiago',
      availability: 'online',
      avatar: 'assets/Thiago.jpg', // corrigido
      lat: -23.553,
      lng: -46.645,
    },
    {
      id: 3,
      name: 'Pedro',
      availability: 'busy',
      avatar: 'assets/Pedro.jpg',
      lat: -23.566,
      lng: -46.641,
    },
  ],
  incidents: [],
  feedbacks: [],
};

/* -------- Helpers de domínio -------- */
const calcDeliveryCost = (d) => Number((d.km * d.priceKm).toFixed(2));

/* -------- API (mock) -------- */
export const api = {
  // Listagens
  async listDeliveries() {
    await delay();
    return clone(DB.deliveries).map(d => ({ ...d, cost: calcDeliveryCost(d) }));
  },

  async listDeliveriesByStatus(status = 'all') {
    await delay();
    const src = status === 'all'
      ? DB.deliveries
      : DB.deliveries.filter(d => d.status === status);
    return clone(src).map(d => ({ ...d, cost: calcDeliveryCost(d) }));
  },

  async listCouriers() {
    await delay();
    // garante avatar fallback
    return clone(DB.couriers).map(c => ({
      ...c,
      avatar: c.avatar || 'assets/user.jpg',
    }));
  },

  // Mutação de entrega
  async updateDelivery(id, patch) {
    await delay();
    const d = DB.deliveries.find(d => d.id === id);
    if (!d) return false;
    Object.assign(d, patch);
    return true;
  },

  async setDeliveryStatus(id, status) {
    await delay();
    const d = DB.deliveries.find(x => x.id === id);
    if (!d) return false;
    d.status = status;
    if (status === 'done') {
      d.etaMin = 0;
      d.finishedAt = Date.now();
    }
    return true;
  },

  // Incidentes e feedback
  async logIncident(payload) {
    await delay();
    DB.incidents.push({ id: Date.now(), ...payload });
    return true;
  },

  async pushFeedback(payload) {
    await delay();
    DB.feedbacks.push({ id: Date.now(), ...payload });
    return true;
  },

  // Tracking público (por token) – e suporte opcional por id
  async getTracking(tokenOrId) {
    await delay();
    let d =
      DB.deliveries.find(x => x.token === tokenOrId) ??
      DB.deliveries.find(x => String(x.id) === String(tokenOrId));
    if (!d) return null;

    const courier = DB.couriers.find(c => c.id === d.courierId);
    return {
      id: d.id,
      status: d.status,
      courier: courier?.name ?? '—',
      etaMin: d.etaMin,
      address: d.address,
      cost: calcDeliveryCost(d),
      courierAvatar: courier?.avatar || 'assets/user.jpg',
      courierPos: courier ? { lat: courier.lat, lng: courier.lng } : null,
    };
  },
};
