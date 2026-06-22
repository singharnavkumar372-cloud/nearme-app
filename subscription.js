/* subscription.js — NearMe Subscription System v1.0
   Razorpay payment integration + plan management
   Works on GitHub Pages — no backend needed for UI
   Connect your Razorpay Key ID in settings to enable real payments */
(function () {
  'use strict';

  const SUB_KEY      = 'nm_subscription';
  const SUB_HIST_KEY = 'nm_sub_history';
  const FB_KEY       = 'nm_firebase_url';

  // ── Razorpay Key — Replace with your own from razorpay.com ──
  // Get free test key at: https://dashboard.razorpay.com/app/keys
  const RAZORPAY_KEY = localStorage.getItem('nm_razorpay_key') || 'rzp_test_YOUR_KEY_HERE';

  const PLANS = {
    free:     { name:'Free',     price:0,   color:'#6b7280', features:['5 searches/day','500m radius','Save 5 places'] },
    pro:      { name:'Pro',      price:99,  color:'#6c63ff', features:['Unlimited searches','20km radius','All categories','Voice navigation','Trip planner','Offline mode'] },
    business: { name:'Business', price:499, color:'#f59e0b', features:['Everything in Pro','Admin dashboard','Analytics','API access','Priority support 24/7'] },
  };

  // ── Get current subscription ──────────────────────────────────
  function getSub() {
    try {
      const s = JSON.parse(localStorage.getItem(SUB_KEY) || 'null');
      if (!s) return { plan:'free', active:true, expiresAt:null };
      // Check if expired
      if (s.expiresAt && Date.now() > s.expiresAt) {
        localStorage.removeItem(SUB_KEY);
        return { plan:'free', active:true, expiresAt:null };
      }
      return s;
    } catch { return { plan:'free', active:true, expiresAt:null }; }
  }

  function setSub(plan, paymentId, orderId, amount) {
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    const sub = {
      plan, paymentId, orderId, amount,
      startedAt: Date.now(),
      expiresAt,
      active: true,
    };
    localStorage.setItem(SUB_KEY, JSON.stringify(sub));

    // Save to history
    const hist = JSON.parse(localStorage.getItem(SUB_HIST_KEY) || '[]');
    hist.unshift({ ...sub, date: new Date().toISOString() });
    localStorage.setItem(SUB_HIST_KEY, JSON.stringify(hist.slice(0, 50)));

    // Save to Firebase
    _saveToFirebase(sub);

    updateUpgradeBtn();
    return sub;
  }

  async function _saveToFirebase(sub) {
    const fbUrl = localStorage.getItem(FB_KEY);
    const sid   = localStorage.getItem('nm_session_id');
    if (!fbUrl || !sid) return;
    try {
      await fetch(`${fbUrl}/subscriptions/${sid}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sub,
          sessionId: sid,
          city: document.getElementById('location-city')?.textContent || '',
          device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
          ts: Date.now(),
        }),
      });
    } catch {}
  }

  // ── Update UI based on plan ────────────────────────────────────
  function updateUpgradeBtn() {
    const sub = getSub();
    const btn = document.getElementById('upgrade-btn');
    const badge = document.getElementById('auth-plan-badge');
    if (!btn) return;
    if (sub.plan === 'free') {
      btn.style.display = 'flex';
      btn.innerHTML = '⚡ Upgrade';
      if (badge) badge.textContent = 'FREE';
    } else {
      btn.innerHTML = `✨ ${PLANS[sub.plan]?.name || 'Pro'}`;
      btn.style.background = 'none';
      btn.style.border = `1.5px solid ${PLANS[sub.plan]?.color || '#6c63ff'}`;
      btn.style.color = PLANS[sub.plan]?.color || '#6c63ff';
      if (badge) badge.textContent = (sub.plan || 'PRO').toUpperCase();
    }
  }

  // ── Check if feature is allowed ───────────────────────────────
  function canUse(feature) {
    const sub = getSub();
    if (sub.plan === 'business') return true;
    if (sub.plan === 'pro') {
      return feature !== 'api_access'; // business only
    }
    // Free plan limits
    const freeAllowed = ['basic_search','map','categories_basic','save_5'];
    return freeAllowed.includes(feature);
  }

  // ── Modal ──────────────────────────────────────────────────────
  function showModal() {
    const sub = getSub();
    const modal = document.getElementById('sub-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('open'), 10);

    // Highlight current plan
    document.querySelectorAll('.sub-plan').forEach(p => p.classList.remove('current'));
    const cur = document.getElementById('plan-' + sub.plan);
    if (cur) cur.classList.add('current');

    // Show main view
    document.getElementById('sub-main-view').style.display = 'block';
    document.getElementById('sub-success-view').style.display = 'none';
  }

  function hideModal() {
    const modal = document.getElementById('sub-modal');
    if (!modal) return;
    modal.classList.remove('open');
    setTimeout(() => modal.style.display = 'none', 300);
  }

  // ── Payment ────────────────────────────────────────────────────
  function startPayment(plan, amount) {
    const userName  = window.NearMeAuth?.currentUser?.name || 'User';
    const userEmail = window.NearMeAuth?.currentUser?.email || '';

    // If no Razorpay key configured, show setup message
    if (RAZORPAY_KEY.includes('YOUR_KEY_HERE')) {
      showSetupMsg(plan, amount);
      return;
    }

    try {
      const rzp = new Razorpay({
        key:         RAZORPAY_KEY,
        amount:      amount * 100, // paise
        currency:    'INR',
        name:        'NearMe',
        description: `NearMe ${PLANS[plan].name} Plan — 1 Month`,
        image:       'https://singharnavkumar372-cloud.github.io/nearme-app/icon-192.png',
        prefill: {
          name:  userName,
          email: userEmail,
        },
        theme: { color: '#6c63ff' },
        handler: function (response) {
          // Payment successful!
          onPaymentSuccess(plan, amount, response.razorpay_payment_id, response.razorpay_order_id || '');
        },
      });
      rzp.on('payment.failed', () => {
        if (window.toast) window.toast('❌ Payment failed — please try again');
      });
      rzp.open();
    } catch (e) {
      console.error('Razorpay error:', e);
      showSetupMsg(plan, amount);
    }
  }

  function onPaymentSuccess(plan, amount, paymentId, orderId) {
    setSub(plan, paymentId, orderId, amount);
    // Show success screen
    document.getElementById('sub-main-view').style.display = 'none';
    const sv = document.getElementById('sub-success-view');
    sv.style.display = 'block';
    const title = sv.querySelector('h2');
    if (title) title.textContent = `Welcome to ${PLANS[plan]?.name}!`;
    if (window.toast) window.toast(`🎉 ${PLANS[plan]?.name} plan activated!`);
  }

  function showSetupMsg(plan, amount) {
    // For demo / when Razorpay not configured — simulate payment
    if (confirm(`[DEMO MODE]\n\nRazorpay key not configured.\n\nTo accept real payments:\n1. Sign up at razorpay.com (free)\n2. Go to Settings → API Keys\n3. Copy your Key ID\n4. Admin Panel → Settings → Razorpay Key\n\nSimulate successful payment of ₹${amount} for ${PLANS[plan].name} plan?`)) {
      onPaymentSuccess(plan, amount, 'demo_' + Date.now(), 'demo_order');
    }
  }

  // ── Init ───────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    updateUpgradeBtn();

    // Close on overlay click
    document.getElementById('sub-modal')?.addEventListener('click', e => {
      if (e.target.id === 'sub-modal') hideModal();
    });
  });

  // ── Public API ─────────────────────────────────────────────────
  window.NearMeSubscription = {
    get:       getSub,
    set:       setSub,
    canUse:    canUse,
    show:      showModal,
    hide:      hideModal,
    getHistory: () => JSON.parse(localStorage.getItem(SUB_HIST_KEY) || '[]'),
    isPro:     () => ['pro','business'].includes(getSub().plan),
    isBusiness:() => getSub().plan === 'business',
  };
  window.showSubscriptionModal = showModal;
  window.hideSubscriptionModal = hideModal;
  window.startPayment          = startPayment;
})();
