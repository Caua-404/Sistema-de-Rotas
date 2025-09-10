import { $, readLocal } from './_utils.js';

// avatar preview
const btnEditAvatar = $('#btnEditAvatar');
const avatarInput   = $('#avatarInput');
const avatarImg     = $('#settingsAvatar');
btnEditAvatar?.addEventListener('click', () => avatarInput?.click());
avatarInput?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  avatarImg.src = url; // preview
});

// hidrata nome/email/cnpj no topo a partir dos dados da conta salvos
const acc = readLocal('mr_account') || {};
$('#greetName')   && ($('#greetName').textContent = acc.name || 'Usuário');
$('#profileEmail')&& ($('#profileEmail').textContent = acc.email || 'usuario@exemplo.com');
$('#profileCNPJ') && ($('#profileCNPJ').textContent = acc.cnpj || acc.cpf || '00.000.000/0000-00');
