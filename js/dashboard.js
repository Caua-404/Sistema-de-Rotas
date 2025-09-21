// js/dashboard.js
import { api } from './services/api.js';

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const root = document.getElementById('dashRoot');
  if (!root) return;

  // carrega dados mock do serviço
  const [deliveries, couriers] = await Promise.all([
    api.listDeliveries(),
    api.listCouriers()
  ]);

  // ===== KPIs
  const total = deliveries.length;
  const done  = deliveries.filter(d => d.status === 'done').length;
  const late  = deliveries.filter(d => d.status === 'late').length;
  const on    = deliveries.filter(d => d.status === 'on').length;

  // ===== HTML base do dashboard
  root.innerHTML = `
    <div class="container py-3">
      <h2 class="mb-3">Visão Geral</h2>

      <div class="row g-3">
        ${kpiCard('Total', total)}
        ${kpiCard('Finalizadas', done, 'success')}
        ${kpiCard('Atrasadas', late, 'danger')}
        ${kpiCard('Em andamento', on, 'warning')}
      </div>

      <div class="row g-4 mt-1">
        <div class="col-lg-6">
          <div class="card p-3">
            <h5 class="mb-3">Entregas por Status</h5>
            <canvas id="chartStatus" height="220"></canvas>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card p-3">
            <h5 class="mb-3">Entregas por Motoboy</h5>
            <canvas id="chartCouriers" height="220"></canvas>
          </div>
        </div>
      </div>

      <div class="card p-3 mt-4">
        <h5 class="mb-3">Últimas entregas</h5>
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>#Pedido</th>
                <th>Cliente</th>
                <th>Motoboy</th>
                <th>Status</th>
                <th>ETA (min)</th>
                <th>KM</th>
              </tr>
            </thead>
            <tbody id="lastDeliveries"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // preenche tabela
  fillLastDeliveries('#lastDeliveries', deliveries, couriers);

  // garante Chart.js carregado (caso esqueça a tag na página)
  if (!window.Chart) {
    await loadScript('https://cdn.jsdelivr.net/npm/chart.js');
  }

  // paleta (fixa para combinar com o app)
  const COLORS = {
    green:  '#10B981', // done
    red:    '#EF4444', // late
    amber:  '#F59E0B', // on
    text:   getComputedStyle(document.documentElement).getPropertyValue('--text')?.trim() || '#eee',
    grid:   'rgba(180,180,180,.22)'
  };

  // ===== pizza por status
  const ctx1 = document.getElementById('chartStatus').getContext('2d');
  new Chart(ctx1, {
    type: 'doughnut',
    data: {
      labels: ['Finalizadas', 'Atrasadas', 'Em andamento'],
      datasets: [{
        data: [done, late, on],
        backgroundColor: [COLORS.green, COLORS.red, COLORS.amber],
        borderWidth: 0
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom', labels: { color: COLORS.text } },
        tooltip: { callbacks: { label: (c)=> `${c.label}: ${c.parsed}` } }
      },
      cutout: '58%'
    }
  });

  // ===== barras por motoboy
  const byCourier = countByCourier(deliveries, couriers);
  const ctx2 = document.getElementById('chartCouriers').getContext('2d');
  new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: byCourier.labels,
      datasets: [{
        label: 'Entregas',
        data: byCourier.values,
        backgroundColor: 'rgba(59,130,246,.45)', // azul transluc.
        borderColor: 'rgba(59,130,246,1)',
        borderWidth: 1,
      }]
    },
    options: {
      scales: {
        x: { ticks: { color: COLORS.text }, grid: { display:false } },
        y: { ticks: { color: COLORS.text }, grid: { color: COLORS.grid }, beginAtZero: true, precision:0 }
      },
      plugins: {
        legend: { display:false },
        tooltip: { callbacks: { label: (c)=> ` ${c.parsed.y} entrega(s)` } }
      }
    }
  });
}

/* ===== helpers ===== */

function kpiCard(title, value, tone = 'secondary') {
  // usa cores do Bootstrap para contraste e simplicidade
  const toneClass = tone === 'secondary' ? '' : `text-${tone}`;
  return `
    <div class="col-6 col-md-3">
      <div class="card p-3 h-100">
        <div class="small text-muted">${title}</div>
        <div class="fs-3 fw-bold ${toneClass}">${String(value).padStart(2,'0')}</div>
      </div>
    </div>
  `;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function fillLastDeliveries(tbodySel, deliveries, couriers) {
  const tbody = document.querySelector(tbodySel);
  if (!tbody) return;

  const byId = new Map(couriers.map(c => [c.id, c]));
  const fmtStatus = s => s === 'done' ? 'Finalizada'
                     : s === 'late' ? 'Atrasada'
                     : 'Em andamento';

  // mais recentes primeiro
  const rows = [...deliveries]
    .sort((a,b)=> (b.createdAt||0) - (a.createdAt||0))
    .slice(0, 8)
    .map(d => `
      <tr>
        <td>#${d.id}</td>
        <td>${d.client}</td>
        <td>${byId.get(d.courierId)?.name ?? '—'}</td>
        <td>${fmtStatus(d.status)}</td>
        <td>${d.etaMin ?? 0}</td>
        <td>${d.km?.toFixed?.(1) ?? '-'}</td>
      </tr>
    `).join('');

  tbody.innerHTML = rows;
}

function countByCourier(deliveries, couriers) {
  const map = new Map();
  couriers.forEach(c => map.set(c.id, 0));
  deliveries.forEach(d => map.set(d.courierId, (map.get(d.courierId) ?? 0) + 1));
  const labels = couriers.map(c => c.name);
  const values = couriers.map(c => map.get(c.id) ?? 0);
  return { labels, values };
}
