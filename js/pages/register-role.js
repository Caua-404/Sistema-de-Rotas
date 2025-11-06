// register-role.js — mostra/oculta campos conforme o papel
(function(){
  const $ = (s, el=document)=> el.querySelector(s);

  const roleEmpresa = $('#role-empresa');
  const roleMotoboy = $('#role-motoboy');
  const company = $('#companyFields');
  const courier = $('#courierFields');

  if (!roleEmpresa || !roleMotoboy || !company || !courier) return;

  // util: alterna required/hidden nos grupos
  function toggleRole(role){
    const isEmpresa = role === 'empresa';

    company.hidden = !isEmpresa;
    courier.hidden = isEmpresa;

    // define quais campos são obrigatórios para cada papel
    setRequired(company, isEmpresa, ['bizName','cep','address','city','uf']);
    setRequired(courier, !isEmpresa, ['cpf','cnh','vehicle','plate']);

    // salva escolha
    try { localStorage.setItem('mr_signup_role', role); } catch(_) {}
  }

  function setRequired(container, on, ids){
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.toggleAttribute('required', on);
    });
  }

  // listeners
  roleEmpresa.addEventListener('change', e => { if (e.target.checked) toggleRole('empresa'); });
  roleMotoboy.addEventListener('change', e => { if (e.target.checked) toggleRole('motoboy'); });

  // estado inicial (volta última seleção ou default)
  const last = (localStorage.getItem('mr_signup_role') || 'empresa').toLowerCase();
  if (last === 'motoboy') { roleMotoboy.checked = true; }
  toggleRole(roleMotoboy.checked ? 'motoboy' : 'empresa');
})();
