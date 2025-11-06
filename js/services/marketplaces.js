// js/services/marketplaces.js
export const Marketplaces = {
  // futura chamada real: GET /orders?since=...
  async fetchNewOrders({ marketplace = '', since = 0 } = {}) {
    // MOCK: devolve alguns pedidos fictícios
    const now = Date.now();
    const base = [
      {
        id: `MR-${now.toString().slice(-6)}`,
        marketplace: 'ifood',
        status: 'PLACED',
        createdAt: now - 2 * 60 * 1000,
        customer: { name: 'Ana', phone: '5599990000' },
        items: [{ q:1, name:'Pizza Calabresa' }, { q:2, name:'Coca 350ml' }],
        total: 62.9,
        pickup:  { lat:-23.556, lng:-46.662, name:'Restaurante A' },
        dropoff: { lat:-23.559, lng:-46.642, name:'Cliente Ana' }
      }
    ];
    return base.filter(o => !marketplace || o.marketplace === marketplace);
  }
};

// js/services/marketplaces.js
export const MARKETPLACES = {
  ifood:     { id: 'ifood',     label: 'iFood',       badge: 'mp-ifood' },
  uber:      { id: 'uber',      label: 'Uber Eats',   badge: 'mp-uber'  },
  aiqfome:   { id: 'aiqfome',   label: 'AiQFome',     badge: 'mp-aiq'   },
  rappi:     { id: 'rappi',     label: 'Rappi',       badge: 'mp-rappi' },
  custom:    { id: 'custom',    label: 'MotoRotas',   badge: 'mp-custom'}
};

export const getMarketplace = (id) => MARKETPLACES[id] || null;

export const getMarketplaceLabel = (id) =>
  (MARKETPLACES[id]?.label) || '—';

export const getMarketplaceBadgeClass = (id) =>
  (MARKETPLACES[id]?.badge) || 'mp-generic';
