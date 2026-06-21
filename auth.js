/* ═══════════════════════════════════════════════════
   NearMe Auth v1.0 — Client-side auth (no backend)
   Supports: Email/Password + Google Sign-In (Firebase)
   Works on GitHub Pages — data stored in localStorage
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  const USERS_KEY   = 'nm_users_db';
  const SESSION_KEY = 'nm_auth_session';
  const AVATARS = ['🧑','👩','👨','🧔','👱','🧕','👲','🧑‍💻','👩‍💻','🧑‍🎓','👩‍🎓','👨‍🎓'];

  function genId() {
    return 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  }
  function hashPass(p) {
    // Simple base64 obfuscation — good enough for localStorage demo auth
    return btoa(encodeURIComponent(p + 'nm_salt_2024'));
  }
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; }
  }
  function saveUsers(u) {
    localStorage.setItem(USERS_KEY, JSON.stringify(u));
  }
  function randomAvatar() {
    return AVATARS[Math.floor(Math.random() * AVATARS.length)];
  }

  const Auth = {
    currentUser: null,

    init() {
      try {
        const s = localStorage.getItem(SESSION_KEY);
        if (s) {
          this.currentUser = JSON.parse(s);
          // Migrate saved places to user account
          this._migrateSavedPlaces();
        }
      } catch {}
    },

    signUp(name, email, password) {
      if (!name || !email || !password) throw new Error('All fields required');
      if (password.length < 6) throw new Error('Password must be at least 6 characters');
      const users = getUsers();
      const key = email.toLowerCase().trim();
      if (users[key]) throw new Error('An account with this email already exists');
      const user = {
        id: genId(),
        name: name.trim(),
        email: key,
        password: hashPass(password),
        avatar: randomAvatar(),
        created: Date.now(),
        plan: 'free',
      };
      users[key] = user;
      saveUsers(users);
      this._setSession(user);
      return user;
    },

    signIn(email, password) {
      const users = getUsers();
      const key = email.toLowerCase().trim();
      const user = users[key];
      if (!user) throw new Error('No account found with this email');
      if (user.password !== hashPass(password)) throw new Error('Incorrect password');
      this._setSession(user);
      return user;
    },

    signInWithGoogle(googleUser) {
      // Called by Firebase/Google after successful OAuth
      const users = getUsers();
      const key = googleUser.email.toLowerCase();
      let user = users[key];
      if (!user) {
        user = {
          id: 'g_' + googleUser.uid,
          name: googleUser.displayName || googleUser.email.split('@')[0],
          email: key,
          password: null,
          avatar: googleUser.photoURL || randomAvatar(),
          created: Date.now(),
          plan: 'free',
          google: true,
          photoURL: googleUser.photoURL,
        };
        users[key] = user;
        saveUsers(users);
      }
      this._setSession(user);
      return user;
    },

    signOut() {
      this.currentUser = null;
      localStorage.removeItem(SESSION_KEY);
      updateAuthUI(null);
      if (window.toast) window.toast('👋 Signed out');
    },

    updateProfile(updates) {
      if (!this.currentUser) return;
      const users = getUsers();
      const key = this.currentUser.email;
      if (users[key]) {
        Object.assign(users[key], updates);
        Object.assign(this.currentUser, updates);
        saveUsers(users);
        this._setSession(this.currentUser);
      }
    },

    _setSession(user) {
      // Don't store password in session
      const session = { ...user };
      delete session.password;
      this.currentUser = session;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      updateAuthUI(session);
    },

    _migrateSavedPlaces() {
      // Move anonymous saved places to user account
      const anon = JSON.parse(localStorage.getItem('nm_saved') || '[]');
      if (anon.length && this.currentUser) {
        const key = `nm_saved_${this.currentUser.id}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.length && anon.length) {
          localStorage.setItem(key, JSON.stringify(anon));
        }
      }
    },

    getSavedKey() {
      return this.currentUser ? `nm_saved_${this.currentUser.id}` : 'nm_saved';
    },

    isLoggedIn() {
      return !!this.currentUser;
    },
  };

  // ── UI Update ─────────────────────────────────────
  function updateAuthUI(user) {
    const btn   = document.getElementById('auth-btn');
    const avatar = document.getElementById('auth-avatar');
    const name  = document.getElementById('auth-name');
    const menu  = document.getElementById('auth-dropdown');

    if (!btn) return;

    if (user) {
      btn.innerHTML = user.photoURL
        ? `<img src="${user.photoURL}" style="width:28px;height:28px;border-radius:50%;object-fit:cover"/>`
        : `<span style="font-size:1.3rem">${user.avatar || '🧑'}</span>`;
      btn.title = user.name;
      if (avatar) avatar.textContent = user.photoURL ? '' : (user.avatar || '🧑');
      if (name)   name.textContent   = user.name;

      const logoutBtn = document.getElementById('auth-logout-btn');
      if (logoutBtn) logoutBtn.style.display = 'block';
      const loginBtns = document.querySelectorAll('.auth-login-only');
      loginBtns.forEach(el => el.style.display = 'none');
    } else {
      btn.innerHTML = '<span style="font-size:.78rem;font-weight:700">Sign In</span>';
      btn.title = 'Sign In';
      const logoutBtn = document.getElementById('auth-logout-btn');
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  }

  // ── Modal Logic ────────────────────────────────────
  function showAuthModal(tab) {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('open'), 10);
    switchAuthTab(tab || 'signin');
  }

  function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.remove('open');
    setTimeout(() => modal.style.display = 'none', 300);
    clearAuthErrors();
  }

  function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.auth-panel').forEach(p => p.style.display = p.id === `auth-${tab}-panel` ? 'block' : 'none');
  }

  function clearAuthErrors() {
    document.querySelectorAll('.auth-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.auth-input').forEach(el => el.classList.remove('error'));
  }

  function showAuthError(panelId, msg) {
    const el = document.getElementById(panelId + '-error');
    if (el) { el.textContent = msg; }
  }

  // ── Wire Events (called after DOM ready) ──────────
  function wireEvents() {
    // Open modal
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) authBtn.addEventListener('click', () => {
      if (Auth.currentUser) {
        const dd = document.getElementById('auth-dropdown');
        if (dd) dd.classList.toggle('open');
      } else {
        showAuthModal('signin');
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', e => {
      const dd = document.getElementById('auth-dropdown');
      const btn = document.getElementById('auth-btn');
      if (dd && !dd.contains(e.target) && !btn?.contains(e.target)) {
        dd.classList.remove('open');
      }
    });

    // Close modal
    const closeBtn = document.getElementById('auth-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', hideAuthModal);
    document.getElementById('auth-modal')?.addEventListener('click', e => {
      if (e.target.id === 'auth-modal') hideAuthModal();
    });

    // Tab switching
    document.querySelectorAll('.auth-tab-btn').forEach(b => {
      b.addEventListener('click', () => switchAuthTab(b.dataset.tab));
    });

    // Sign up link
    document.getElementById('auth-goto-signup')?.addEventListener('click', e => {
      e.preventDefault(); switchAuthTab('signup');
    });
    document.getElementById('auth-goto-signin')?.addEventListener('click', e => {
      e.preventDefault(); switchAuthTab('signin');
    });

    // Sign in form
    document.getElementById('auth-signin-form')?.addEventListener('submit', e => {
      e.preventDefault();
      clearAuthErrors();
      const email = document.getElementById('signin-email').value;
      const pass  = document.getElementById('signin-pass').value;
      try {
        Auth.signIn(email, pass);
        hideAuthModal();
        if (window.toast) window.toast(`👋 Welcome back, ${Auth.currentUser.name}!`);
      } catch (err) {
        showAuthError('signin', err.message);
      }
    });

    // Sign up form
    document.getElementById('auth-signup-form')?.addEventListener('submit', e => {
      e.preventDefault();
      clearAuthErrors();
      const name  = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const pass  = document.getElementById('signup-pass').value;
      const pass2 = document.getElementById('signup-pass2').value;
      if (pass !== pass2) { showAuthError('signup', 'Passwords do not match'); return; }
      try {
        Auth.signUp(name, email, pass);
        hideAuthModal();
        if (window.toast) window.toast(`🎉 Welcome, ${Auth.currentUser.name}!`);
      } catch (err) {
        showAuthError('signup', err.message);
      }
    });

    // Sign out
    document.getElementById('auth-logout-btn')?.addEventListener('click', () => {
      document.getElementById('auth-dropdown')?.classList.remove('open');
      Auth.signOut();
    });

    // Profile page link
    document.getElementById('auth-profile-link')?.addEventListener('click', () => {
      document.getElementById('auth-dropdown')?.classList.remove('open');
      showProfileModal();
    });

    // Password show/hide
    document.querySelectorAll('.pass-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = document.getElementById(btn.dataset.target);
        if (!inp) return;
        inp.type = inp.type === 'password' ? 'text' : 'password';
        btn.textContent = inp.type === 'password' ? '👁️' : '🙈';
      });
    });
  }

  function showProfileModal() {
    if (!Auth.currentUser) return;
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    document.getElementById('profile-avatar-display').textContent = Auth.currentUser.avatar || '🧑';
    document.getElementById('profile-name-display').textContent = Auth.currentUser.name;
    document.getElementById('profile-email-display').textContent = Auth.currentUser.email;
    document.getElementById('profile-plan-display').textContent = (Auth.currentUser.plan || 'free').toUpperCase();
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('open'), 10);
  }

  function wireProfileModal() {
    document.getElementById('profile-modal-close')?.addEventListener('click', () => {
      const m = document.getElementById('profile-modal');
      m?.classList.remove('open');
      setTimeout(() => m && (m.style.display = 'none'), 300);
    });

    // Avatar picker
    document.querySelectorAll('.avatar-option').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.avatar-option').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
        Auth.updateProfile({ avatar: el.textContent });
        document.getElementById('profile-avatar-display').textContent = el.textContent;
        if (window.toast) window.toast('✅ Avatar updated');
      });
    });
  }

  // ── Init ──────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    wireEvents();
    wireProfileModal();
    updateAuthUI(Auth.currentUser);
  });

  window.NearMeAuth = Auth;
  window.showAuthModal = showAuthModal;
  window.hideAuthModal = hideAuthModal;
})();
