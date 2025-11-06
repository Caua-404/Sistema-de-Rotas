// js/services/auth.js
import { api } from './api.js';

export const Auth = {
  /**
   * Realiza login (mock local ou API real)
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{id:number,email:string,role:string}>}
   */
  async login(email, password) {
    const norm = (s) => (s || '').normalize('NFKC').trim();

    // --- MOCK TEMPORÁRIO ---
    const USER_OK = 'Teste';
    const PASS_OK = 'Faz o L 123';
    const ok = norm(email) === USER_OK && password === PASS_OK;
    if (!ok) throw new Error('Usuário ou senha inválidos.');

    // salva e retorna mock
    try { localStorage.setItem('mr_last_user', email); } catch {}
    return { id: 1, email, role: 'ADMIN' };

    // --- Quando integrar backend, troque por: ---
    // return await api.post('/auth/login', { email, password });
  },

  /**
   * Realiza cadastro (mock local ou API real)
   */
  async signup({ name, email, password, role = 'empresa' }) {
    if (!name || !email || !password)
      throw new Error('Preencha todos os campos obrigatórios.');

    try {
      const db = JSON.parse(localStorage.getItem('mr_users') || '[]');
      db.push({
        id: crypto?.randomUUID?.() || String(Date.now()),
        name, email, role,
        createdAt: Date.now(),
      });
      localStorage.setItem('mr_users', JSON.stringify(db));
    } catch (e) {
      console.error('Erro ao salvar usuário:', e);
    }

    return { ok: true, message: 'Cadastro realizado!' };

    // --- Futuro ---
    // return await api.post('/auth/signup', { name, email, password, role });
  },

  /**
   * Logout básico (limpa sessão local)
   */
  async logout() {
    try {
      localStorage.removeItem('mr_last_user');
      // Em backend real: await api.post('/auth/logout');
    } catch {}
    location.href = './login.html';
  },
};
