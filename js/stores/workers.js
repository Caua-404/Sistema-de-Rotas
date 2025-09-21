import { api } from '../services/api.js';

export const workersStore = {
  data: [],
  async load(){ this.data = await api.listCouriers(); return this.data; },
  available(){ return this.data.filter(c=>c.availability!=='offline'); },
  byId(id){ return this.data.find(c=>c.id===id); }
};
