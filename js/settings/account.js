import { $, on, maskCPF, maskCNPJ, maskCEP, maskPhone, saveLocal, readLocal } from './_utils.js';

// elementos
const accType = $('#accType');
const pjBox = $('#pjFields');
const pfBox = $('#pfFields');
const cnpjI = $('#cnpj');
const cpfI  = $('#cpf');

// alterna PF/PJ
function togglePersonType(){
  const isPF = accType?.value === 'PF';
  if (!pjBox || !pfBox) return;
  pfBox.hidden = !isPF;
  pjBox.hidden =  isPF;
  if (cnpjI) cnpjI.required = !isPF;
  if (cpfI)  cpfI.required  =  isPF;
}
accType && on(accType, 'change', togglePersonType);
togglePersonType();

// máscaras
on($('#cpf'),   'input', e => e.target.value = maskCPF(e.target.value));
on($('#cnpj'),  'input', e => e.target.value = maskCNPJ(e.target.value));
on($('#cep'),   'input', e => e.target.value = maskCEP(e.target.value));
on($('#phone'), 'input', e => e.target.value = maskPhone(e.target.value));

// salvar
on($('#btnSaveAccount'), 'click', () => {
  const required = ['#name','#email','#phone','#cep','#uf','#logradouro','#numero','#bairro','#cidade'];
  (accType?.value === 'PF') ? required.push('#cpf') : required.push('#cnpj');

  for (const sel of required){
    const input = $(sel);
    if (!input || !input.value.trim()){
      input?.focus();
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
  }

  const data = {
    type: accType?.value,
    name: $('#name')?.value.trim(),
    cnpj: cnpjI?.value.trim(),
    cpf:  cpfI?.value.trim(),
    fantasia: $('#fantasia')?.value.trim(),
    email: $('#email')?.value.trim(),
    phone: $('#phone')?.value.trim(),
    cep: $('#cep')?.value.trim(),
    uf:  $('#uf')?.value,
    logradouro: $('#logradouro')?.value.trim(),
    numero: $('#numero')?.value.trim(),
    bairro: $('#bairro')?.value.trim(),
    cidade: $('#cidade')?.value.trim(),
    tz: $('#tz')?.value,
    contactPref: $('#contactPref')?.value
  };

  saveLocal('mr_account', data);
  alert('Dados salvos com sucesso!');
});

// hidratar (sem optional chaining no lado esquerdo!)
(function hydrate(){
  const d = readLocal('mr_account'); if (!d) return;

  const setVal = (sel, val) => { const el = $(sel); if (el) el.value = val; };

  if (accType) accType.value = d.type || 'PJ';
  togglePersonType();

  setVal('#name', d.name || '');
  setVal('#cnpj', d.cnpj || '');
  setVal('#cpf',  d.cpf  || '');
  setVal('#fantasia', d.fantasia || '');
  setVal('#email', d.email || '');
  setVal('#phone', d.phone || '');
  setVal('#cep', d.cep || '');
  setVal('#uf', d.uf || '');
  setVal('#logradouro', d.logradouro || '');
  setVal('#numero', d.numero || '');
  setVal('#bairro', d.bairro || '');
  setVal('#cidade', d.cidade || '');
  setVal('#tz', d.tz || 'America/Sao_Paulo');
  setVal('#contactPref', d.contactPref || 'whatsapp');
})();
