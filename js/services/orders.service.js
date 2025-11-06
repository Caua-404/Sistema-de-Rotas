// js/services/orders.service.js
import { MARKETPLACES } from './marketplaces.js';

const STATUSES = ['PLACED','PREPARING','READY','DISPATCHED','DELIVERED','CANCELLED'];

function rand(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }

function makeMockOrder(i){
  const markets = Object.keys(MARKETPLACES);
  const market = markets[rand(0, markets.length-1)];
  const id = `MR-${rand(100000,999999)}`;
  return {
    id,
    market,                              // ifood | uber | aiqfome | rappi | custom
    status: STATUSES[rand(0,2)],         // foca em fases iniciais
    customer: { name: 'Ana' },
    total: 6290,                         // em centavos
    ageMin: rand(1, 30),
    items: [
      { qty: 1, name: 'Pizza Calabresa' },
      { qty: 2, name: 'Coca 350ml' }
    ]
  };
}

// estado local (mock)
let _orders = Array.from({length: 9}, (_,i)=> makeMockOrder(i));
const listeners = new Set();

function notify(){ listeners.forEach(fn => fn(_orders)); }

export const OrdersService = {
  /** Busca todos (mock). Troque pela chamada HTTP no backend. */
  async all(){
    // TODO backend: return fetch('/api/orders').then(r=>r.json())
    return structuredClone(_orders);
  },

  onChange(fn){ listeners.add(fn); return ()=> listeners.delete(fn); },

  /** Simula sync (atualiza status aleatoriamente) */
  async sync(){
    _orders = _orders.map(o => {
      if (o.status === 'PLACED' && Math.random() > .5) o.status = 'PREPARING';
      else if (o.status === 'PREPARING' && Math.random() > .6) o.status = 'READY';
      return o;
    });
    notify();
    return this.all();
  },

  /** Ações */
  async markPreparing(id){
    _orders = _orders.map(o => o.id===id ? {...o, status:'PREPARING'} : o);
    notify();
  },
  async markReady(id){
    _orders = _orders.map(o => o.id===id ? {...o, status:'READY'} : o);
    notify();
  },
  async dispatch(id){
    _orders = _orders.map(o => o.id===id ? {...o, status:'DISPATCHED'} : o);
    notify();
  },

  /** Utils de filtro */
  filter(list, {q, market, status}){
    return list.filter(o=>{
      if (market && o.market !== market) return false;
      if (status && o.status !== status) return false;
      if (q){
        const hay = `${o.id} ${o.customer?.name||''} ${o.items.map(i=>i.name).join(' ')}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }
};
