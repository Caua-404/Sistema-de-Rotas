import { $, saveLocal, readLocal } from './_utils.js';

const K = { PLAN: 'mr_plan', INVOICES: 'mr_invoices' };

function hydrate(){
  const plan = readLocal(K.PLAN) || { name:'Profissional', price:99.9, nextRenew:'2025-10-20' };
  $('#planCurrent').innerHTML = `${plan.name} — R$ ${plan.price.toFixed(2)} / mês
    <span class="text-muted d-block">Renovação em ${plan.nextRenew}</span>`;

  const method = readLocal('mr_paymethod') || { brand:'Mastercard', last4:'1234', exp:'08/27' };
  $('#payMethod').innerHTML = `${method.brand} final •••• ${method.last4}
    <span class="text-muted d-block">Validade ${method.exp}</span>`;

  const invoices = readLocal(K.INVOICES) || [
    { at:'2025-08-20', plan:'Profissional', value:99.9, status:'Pago' },
    { at:'2025-07-20', plan:'Profissional', value:99.9, status:'Pago' },
    { at:'2025-06-20', plan:'Profissional', value:99.9, status:'Pago' },
  ];
  const tbody = $('#invoiceBody');
  tbody.innerHTML = invoices.map(i=>`
    <tr>
      <td>${i.at}</td>
      <td>${i.plan}</td>
      <td>R$ ${i.value.toFixed(2)}</td>
      <td>${i.status}</td>
      <td><button class="btn btn--ghost btn-sm">Baixar</button></td>
    </tr>
  `).join('');
}
hydrate();

/* eventos */
$('#btnChangePlan')?.addEventListener('click', ()=> $('#planModal').hidden = false);
$('#btnPlanCancel')?.addEventListener('click', ()=> $('#planModal').hidden = true);
$('#planModal')?.addEventListener('click', e=>{ if(e.target.id==='planModal') e.target.hidden = true; });

$('#btnPlanSave')?.addEventListener('click', ()=>{
  const sel = $('#planSelect').value;
  const plans = {
    basic:{ name:'Básico', price:49.9 },
    pro:{ name:'Profissional', price:99.9 },
    enterprise:{ name:'Enterprise', price:299.9 }
  };
  const p = plans[sel];
  const data = { ...p, nextRenew:'2025-11-20' };
  saveLocal(K.PLAN, data);
  $('#planModal').hidden = true;
  hydrate();
  alert('Plano atualizado!');
});

$('#btnCancelPlan')?.addEventListener('click', ()=>{
  if (confirm('Tem certeza que deseja cancelar sua assinatura?')){
    saveLocal(K.PLAN, { name:'Nenhum', price:0, nextRenew:'-' });
    hydrate();
  }
});

$('#btnUpdateCard')?.addEventListener('click', ()=>{
  alert('Abrir fluxo de atualização de cartão (mock).');
});
