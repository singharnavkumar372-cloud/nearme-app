/* tracker.js — NearMe User Session Tracker v2
   Now uses the local Python backend API (/api/track)
   Falls back to localStorage if API is unavailable
   ⚠️ Only tracks users who explicitly accept the consent banner */
(function () {
  const SESSION_KEY = 'nm_session_id';
  const FIRST_KEY   = 'nm_tracker_first';
  const VISITS_KEY  = 'nm_tracker_visits';
  const ALL_KEY     = 'nm_all_sessions';
  const CONSENT_KEY = 'nm_track_consent';

  // Auto-detect server URL (works on localhost AND when hosted online)
  const API_BASE = window.location.origin;

  function genId() {
    return 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
  function getBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Edg'))      return 'Edge';
    if (ua.includes('Chrome'))   return 'Chrome';
    if (ua.includes('Firefox'))  return 'Firefox';
    if (ua.includes('Safari'))   return 'Safari';
    if (ua.includes('Opera'))    return 'Opera';
    return 'Other';
  }
  function getDevice() {
    return /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
  }
  function getOS() {
    const ua = navigator.userAgent;
    if (ua.includes('Android'))  return 'Android';
    if (/iPhone|iPad/.test(ua))  return 'iOS';
    if (ua.includes('Win'))      return 'Windows';
    if (ua.includes('Mac'))      return 'macOS';
    if (ua.includes('Linux'))    return 'Linux';
    return 'Unknown';
  }

  const Tracker = {
    sessionId: null,

    init() {
      let sid = localStorage.getItem(SESSION_KEY);
      if (!sid) { sid = genId(); localStorage.setItem(SESSION_KEY, sid); }
      this.sessionId = sid;
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

    async track(lat, lon, city) {
      if (!this.hasConsent()) return;

      const visitCount = parseInt(localStorage.getItem(VISITS_KEY) || '0') + 1;
      localStorage.setItem(VISITS_KEY, visitCount);

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
        screen:     `${screen.width}×${screen.height}`,
        firstVisit: !localStorage.getItem(FIRST_KEY),
        visitCount: visitCount,
        timeFirst:  localStorage.getItem(FIRST_KEY) || Date.now(),
        timeLast:   Date.now(),
        online:     true,
        referrer:   document.referrer || 'direct',
        url:        window.location.href,
      };

      if (!localStorage.getItem(FIRST_KEY)) {
        localStorage.setItem(FIRST_KEY, String(Date.now()));
      }

      // ── Save to localStorage (always works) ──────────────────────
      const all = JSON.parse(localStorage.getItem(ALL_KEY) || '[]');
      const idx = all.findIndex(s => s.id === this.sessionId);
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...data };
      } else {
        all.unshift(data);
      }
      localStorage.setItem(ALL_KEY, JSON.stringify(all.slice(0, 500)));

      // ── Send to Python backend API ────────────────────────────────
      try {
        await fetch(`${API_BASE}/api/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } catch {
        // API not running — localStorage fallback already saved it
      }
    },

    async updateLocation(lat, lon) {
      if (!this.hasConsent()) return;
      const update = {
        id: this.sessionId,
        lat: parseFloat(lat.toFixed(5)),
        lon: parseFloat(lon.toFixed(5)),
        timeLast: Date.now(),
        online: true,
      };
      // Update localStorage
      const all = JSON.parse(localStorage.getItem(ALL_KEY) || '[]');
      const s = all.find(x => x.id === this.sessionId);
      if (s) { Object.assign(s, update); localStorage.setItem(ALL_KEY, JSON.stringify(all)); }
      // Update API
      try {
        await fetch(`${API_BASE}/api/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });
      } catch {}
    },

    async markOffline() {
      if (!this.hasConsent()) return;
      const update = { id: this.sessionId, online: false, timeLast: Date.now() };
      try {
        await fetch(`${API_BASE}/api/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });
      } catch {}
    },

    getAll() {
      return JSON.parse(localStorage.getItem(ALL_KEY) || '[]');
    },

    async getAllFromServer() {
      try {
        const res = await fetch(`${API_BASE}/api/users`);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return this.getAll(); // Fall back to local
      }
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
