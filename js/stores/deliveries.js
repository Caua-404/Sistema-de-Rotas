// Store reativo simples para entregas
import { api } from '../services/api.js';

const state = {
  items: [],
  status: 'all', // all | on | done | late
};

const listeners = new Set();
const notify = () => listeners.forEach(fn => fn({ ...state }));

export function subscribe(fn) {
  listeners.add(fn);
  // primeira emissão imediata
  fn({ ...state });
  return () => listeners.delete(fn);
}

export async function loadAll() {
  state.status = 'all';
  state.items = await api.listDeliveries();
  notify();
}

export async function loadByStatus(status = 'all') {
  state.status = status;
  state.items = await api.listDeliveriesByStatus(status);
  notify();
}

export async function setStatus(id, newStatus) {
  const ok = await api.setDeliveryStatus(id, newStatus);
  if (ok) {
    // atualiza em memória para evitar novo roundtrip
    const d = state.items.find(x => x.id === id);
    if (d) d.status = newStatus;
    // se o filtro atual não “aceita” esse item, recarrega filtro
    await loadByStatus(state.status);
  }
  return ok;
}

export function getKpis() {
  const all = state.items.length && state.status === 'all'
    ? state.items
    : null;

  const source = all ? all : state.items;

  // quando não estamos em 'all', pedimos todas só pra kpi ficar correto
  // (sem bloquear a UI). quem quiser 100% exato pode trocar por await api.listDeliveries()
  const counts = { late: 0, done: 0, on: 0 };
  source.forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1; });

  return counts;
}

export function getState() {
  return { ...state };
}
