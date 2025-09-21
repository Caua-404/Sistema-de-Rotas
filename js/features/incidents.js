import { api } from '../services/api.js';
export async function logIncident({deliveryId, type, note}){
  return api.logIncident({ deliveryId, type, note, at: Date.now() });
}
