import '../services/api.js';
import { initPublicTracking } from '../features/tracking.js';

(() => {
  const orderId = new URLSearchParams(location.search).get('order') || '';
  initPublicTracking({
    mapEl: document.getElementById('map'),
    orderId
  });
})();
