// interface.js — hidrata nome e avatar do usuário na interface ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  const greetSpan  = document.getElementById('greetName');   // ex.: <span id="greetName"></span>
  const avatarImg  = document.getElementById('userAvatar');  // ex.: <img id="userAvatar" ...>

  function safeRead(key, parser = JSON.parse){
    try { return parser(localStorage.getItem(key)); } catch { return null; }
  }
  function safeReadSession(key, parser = JSON.parse){
    try { return parser(sessionStorage.getItem(key)); } catch { return null; }
  }

  function setAvatar(src){
    if (!avatarImg) return;
    if (src && typeof src === 'string') {
      avatarImg.src = src;
      avatarImg.removeAttribute('data-initials');
      return;
    }
    // fallback com iniciais (se não houver imagem)
    const name = (greetSpan?.textContent || 'Usuário').trim();
    const initials = name.split(/\s+/).slice(0,2).map(p=>p[0]?.toUpperCase()||'').join('');
    avatarImg.removeAttribute('src');
    avatarImg.setAttribute('alt', 'Avatar do usuário (iniciais)');
    avatarImg.setAttribute('data-initials', initials || 'U');
  }

  function hydrateUser(){
    // 1) nome prioritário vem da sessão (login)
    const auth = safeReadSession('mr_auth') || {};
    const nameFromAuth = auth.user;

    // 2) dados persistentes de conta (podem vir da tela de configurações)
    const acc  = safeRead('mr_account') || {};
    const name = (acc.name || nameFromAuth || 'Usuário').toString();

    if (greetSpan) greetSpan.textContent = name;

    // Avatar pode vir de mr_account.avatar (URL/base64) ou fallback para iniciais
    setAvatar(acc.avatar);

    // garante que o usuário esteja logado (se seu fluxo exigir)
    // if (!auth || !auth.user) window.location.href = 'index.html';
  }

  // aplica ao carregar
  hydrateUser();

  // se a imagem do avatar falhar, cai para iniciais automaticamente
  avatarImg?.addEventListener('error', () => setAvatar(null));

  // se outro separador/aba atualizar o perfil, refletir aqui automaticamente
  window.addEventListener('storage', (e) => {
    if (e.key === 'mr_account') hydrateUser();
  });
});
