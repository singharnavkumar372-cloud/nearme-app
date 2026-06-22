/* tracker.js — NearMe Tracker v3
   FIXED: Now tracks ALL visitors immediately (basic anonymous data — no GPS)
   GPS location only tracked after explicit consent
   Works on GitHub Pages (no server needed) via Firebase or localStorage
   Admin can see ALL users who visited, not just those who accepted consent */
(function () {
  'use strict';

  const SESSION_KEY  = 'nm_session_id';
  const FIRST_KEY    = 'nm_tracker_first';
  const VISITS_KEY   = 'nm_tracker_visits';
  const ALL_KEY      = 'nm_all_sessions';
  const CONSENT_KEY  = 'nm_track_consent';
  const FIREBASE_KEY = 'nm_firebase_url';

  const API_BASE     = window.location.origin;
  const isGHPages    = window.location.hostname.includes('github.io');

  function genId() {
    return 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
  function getBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Edg'))     return 'Edge';
    if (ua.includes('Chrome'))  return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari'))  return 'Safari';
    if (ua.includes('Opera'))   return 'Opera';
    return 'Other';
  }
  function getDevice() {
    return /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
  }
  function getOS() {
    const ua = navigator.userAgent;
    if (ua.includes('Android')) return 'Android';
    if (/iPhone|iPad/.test(ua)) return 'iOS';
    if (ua.includes('Win'))     return 'Windows';
    if (ua.includes('Mac'))     return 'macOS';
    if (ua.includes('Linux'))   return 'Linux';
    return 'Unknown';
  }
  function getCountry() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone.split('/')[0]; } catch { return 'Unknown'; }
  }

  const Tracker = {
    sessionId: null,

    init() {
      let sid = localStorage.getItem(SESSION_KEY);
      if (!sid) { sid = genId(); localStorage.setItem(SESSION_KEY, sid); }
      this.sessionId = sid;

      // ── Track basic anonymous data IMMEDIATELY (no consent needed) ──
      // Only device/browser/timezone — NO GPS, NO personal data
      this._trackBasic();
    },

    _trackBasic() {
      const visitCount = parseInt(localStorage.getItem(VISITS_KEY) || '0') + 1;
      localStorage.setItem(VISITS_KEY, visitCount);

      const now = Date.now();
      const firstVisit = !localStorage.getItem(FIRST_KEY);
      if (firstVisit) localStorage.setItem(FIRST_KEY, String(now));

      const data = {
        id:         this.sessionId,
        lat:        null,
        lon:        null,
        city:       'Unknown',
        device:     getDevice(),
        os:         getOS(),
        browser:    getBrowser(),
        lang:       navigator.language || 'en',
        tz:         Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
        country:    getCountry(),
        screen:     `${screen.width}×${screen.height}`,
        firstVisit: firstVisit,
        visitCount: visitCount,
        timeFirst:  parseInt(localStorage.getItem(FIRST_KEY) || String(now)),
        timeLast:   now,
        online:     true,
        referrer:   document.referrer || 'direct',
        url:        window.location.pathname,
        consentGPS: this.hasConsent(),
        pageTitle:  document.title,
      };

      this._save(data);
    },

    giveConsent() {
      localStorage.setItem(CONSENT_KEY, 'yes');
    },
    revokeConsent() {
      localStorage.setItem(CONSENT_KEY, 'no');
    },
    hasConsent() {
      return localStorage.getItem(CONSENT_KEY) === 'yes';
    },

    // ── Called when GPS location is available ──────────────────────────
    async track(lat, lon, city) {
      const visitCount = parseInt(localStorage.getItem(VISITS_KEY) || '1');
      const now = Date.now();

      const data = {
        id:         this.sessionId,
        lat:        parseFloat(lat.toFixed(5)),
        lon:        parseFloat(lon.toFixed(5)),
        city:       city || 'Unknown',
        device:     getDevice(),
        os:         getOS(),
        browser:    getBrowser(),
        lang:       navigator.language || 'en',
        tz:         Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
        country:    getCountry(),
        screen:     `${screen.width}×${screen.height}`,
        firstVisit: !localStorage.getItem(FIRST_KEY),
        visitCount: visitCount,
        timeFirst:  parseInt(localStorage.getItem(FIRST_KEY) || String(now)),
        timeLast:   now,
        online:     true,
        referrer:   document.referrer || 'direct',
        url:        window.location.pathname,
        consentGPS: true,
      };

      if (!localStorage.getItem(FIRST_KEY)) localStorage.setItem(FIRST_KEY, String(now));
      this._save(data);
    },

    async updateLocation(lat, lon) {
      const update = {
        id: this.sessionId,
        lat: parseFloat(lat.toFixed(5)),
        lon: parseFloat(lon.toFixed(5)),
        timeLast: Date.now(),
        online: true,
        consentGPS: true,
      };
      const all = JSON.parse(localStorage.getItem(ALL_KEY) || '[]');
      const s = all.find(x => x.id === this.sessionId);
      if (s) { Object.assign(s, update); localStorage.setItem(ALL_KEY, JSON.stringify(all)); }
      await this._sendToFirebase(update);
      if (!isGHPages) await this._sendToAPI(update);
    },

    async markOffline() {
      const update = { id: this.sessionId, online: false, timeLast: Date.now() };
      const all = JSON.parse(localStorage.getItem(ALL_KEY) || '[]');
      const s = all.find(x => x.id === this.sessionId);
      if (s) { Object.assign(s, update); localStorage.setItem(ALL_KEY, JSON.stringify(all)); }
      await this._sendToFirebase(update);
      if (!isGHPages) await this._sendToAPI(update);
    },

    _save(data) {
      // 1. Save to localStorage
      const all = JSON.parse(localStorage.getItem(ALL_KEY) || '[]');
      const idx = all.findIndex(s => s.id === this.sessionId);
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...data };
      } else {
        all.unshift(data);
      }
      localStorage.setItem(ALL_KEY, JSON.stringify(all.slice(0, 500)));

      // 2. Send to Firebase (if URL configured)
      this._sendToFirebase(data);

      // 3. Send to Python API (if not GitHub Pages)
      if (!isGHPages) this._sendToAPI(data);
    },

    async _sendToFirebase(data) {
      const fbUrl = localStorage.getItem(FIREBASE_KEY);
      if (!fbUrl) return;
      try {
        const url = `${fbUrl}/sessions/${this.sessionId}.json`;
        await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, serverTime: Date.now() }),
        });
      } catch {}
    },

    async _sendToAPI(data) {
      try {
        await fetch(`${API_BASE}/api/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } catch {}
    },

    getAll() {
      return JSON.parse(localStorage.getItem(ALL_KEY) || '[]');
    },

    async getAllFromServer() {
      // Try Firebase first
      const fbUrl = localStorage.getItem(FIREBASE_KEY);
      if (fbUrl) {
        try {
          const res = await fetch(`${fbUrl}/sessions.json`);
          const data = await res.json();
          if (data) return Object.values(data).sort((a, b) => (b.timeLast || 0) - (a.timeLast || 0));
        } catch {}
      }
      // Try Python API
      if (!isGHPages) {
        try {
          const res = await fetch(`${API_BASE}/api/users`);
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        } catch {}
      }
      // Fallback to localStorage
      return this.getAll();
    },
  };

  Tracker.init();
  window.NearMeTracker = Tracker;

  // Mark offline when tab closes
  window.addEventListener('beforeunload', () => Tracker.markOffline());

  // Update location every 5 minutes if consent given
  setInterval(() => {
    if (Tracker.hasConsent() && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => Tracker.updateLocation(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    }
  }, 5 * 60 * 1000);
})();
