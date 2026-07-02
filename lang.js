/* lang.js — NearMe Multi-Language System v1.0
   Supports: English, Hindi, Hinglish, Punjabi, Bengali, Tamil, Telugu, Marathi
   Auto-detects browser language on first visit
   User preference saved to localStorage */
(function () {
  'use strict';

  const LANG_KEY = 'nm_lang';

  // ── All translations ──────────────────────────────────────────
  const T = {
    en: {
      search_placeholder: 'Search any place…',
      locating: 'Locating…',
      sign_in: 'Sign In',
      find_nearby: 'Find Nearby',
      hospitals: 'Hospitals', restaurants: 'Restaurants', atm: 'ATMs',
      pharmacy: 'Pharmacy', cafe: 'Cafes', petrol: 'Petrol', grocery: 'Grocery',
      park: 'Parks', bank: 'Banks', police: 'Police', hotel: 'Hotels',
      gym: 'Gyms', cinema: 'Cinema', library: 'Library', bus: 'Bus Stop',
      school: 'Schools', dentist: 'Dentist', doctor: 'Doctor',
      restroom: 'Restrooms', post: 'Post Office', parking: 'Parking', worship: 'Worship',
      no_results: 'No places found nearby. Try increasing the radius.',
      loading: 'Finding nearby places…',
      directions: 'Directions',
      save: 'Save',
      share: 'Share',
      call: 'Call',
      open_maps: 'Open in Maps',
      panic: '🆘 Emergency',
      trip_planner: 'Trip Planner',
      weather: 'Weather',
      radius: 'Radius',
      download_app: '📥 Download App',
      choose_lang: '🌐 Choose Language',
      km_away: 'km away',
      m_away: 'm away',
      open_now: 'Open Now',
      closed: 'Closed',
      rate_place: 'Rate this place',
      add_note: 'Add a note…',
      saved: 'Saved!',
      location_error: 'Could not get your location. Please enable GPS.',
      search_results: 'Search Results',
      nearby: 'Nearby',
    },

    hi: {
      search_placeholder: 'कोई भी जगह खोजें…',
      locating: 'स्थान ढूंढ रहे हैं…',
      sign_in: 'साइन इन',
      find_nearby: 'नज़दीकी खोजें',
      hospitals: 'अस्पताल', restaurants: 'रेस्तरां', atm: 'एटीएम',
      pharmacy: 'दवाखाना', cafe: 'कैफे', petrol: 'पेट्रोल', grocery: 'किराना',
      park: 'पार्क', bank: 'बैंक', police: 'पुलिस', hotel: 'होटल',
      gym: 'जिम', cinema: 'सिनेमा', library: 'पुस्तकालय', bus: 'बस स्टॉप',
      school: 'स्कूल', dentist: 'दंत चिकित्सक', doctor: 'डॉक्टर',
      restroom: 'शौचालय', post: 'डाकघर', parking: 'पार्किंग', worship: 'मंदिर/मस्जिद',
      no_results: 'आस-पास कोई जगह नहीं मिली। दायरा बढ़ाएं।',
      loading: 'नज़दीकी जगहें ढूंढ रहे हैं…',
      directions: 'रास्ता',
      save: 'सेव',
      share: 'शेयर',
      call: 'कॉल',
      open_maps: 'मैप में खोलें',
      panic: '🆘 आपातकाल',
      trip_planner: 'यात्रा योजना',
      weather: 'मौसम',
      radius: 'दायरा',
      download_app: '📥 ऐप डाउनलोड',
      choose_lang: '🌐 भाषा चुनें',
      km_away: 'किमी दूर',
      m_away: 'मीटर दूर',
      open_now: 'अभी खुला',
      closed: 'बंद',
      rate_place: 'रेटिंग दें',
      add_note: 'नोट लिखें…',
      saved: 'सेव हो गया!',
      location_error: 'स्थान नहीं मिला। GPS चालू करें।',
      search_results: 'खोज परिणाम',
      nearby: 'नज़दीकी',
    },

    hinglish: {
      search_placeholder: 'Koi bhi jagah dhundho…',
      locating: 'Location dhoondh rahe hain…',
      sign_in: 'Sign In Karo',
      find_nearby: 'Paas mein dhundho',
      hospitals: 'Hospital', restaurants: 'Restaurant', atm: 'ATM',
      pharmacy: 'Medical Store', cafe: 'Cafe', petrol: 'Petrol Pump', grocery: 'Kirana Store',
      park: 'Park', bank: 'Bank', police: 'Police Station', hotel: 'Hotel',
      gym: 'Gym', cinema: 'Cinema Hall', library: 'Library', bus: 'Bus Stop',
      school: 'School', dentist: 'Dentist', doctor: 'Doctor',
      restroom: 'Toilet', post: 'Post Office', parking: 'Parking', worship: 'Mandir/Masjid',
      no_results: 'Koi jagah nahi mili. Radius badha ke try karo.',
      loading: 'Paas ki jagahein dhoondh rahe hain…',
      directions: 'Rasta dikhao',
      save: 'Save Karo',
      share: 'Share Karo',
      call: 'Call Karo',
      open_maps: 'Maps mein kholo',
      panic: '🆘 Emergency',
      trip_planner: 'Trip Plan Karo',
      weather: 'Mausam',
      radius: 'Doori',
      download_app: '📥 App Download Karo',
      choose_lang: '🌐 Bhasha Chuno',
      km_away: 'km door',
      m_away: 'meter door',
      open_now: 'Abhi Khula Hai',
      closed: 'Band Hai',
      rate_place: 'Rating do',
      add_note: 'Note likho…',
      saved: 'Save ho gaya!',
      location_error: 'Location nahi mili. GPS on karo.',
      search_results: 'Search ke Results',
      nearby: 'Paas mein',
    },

    pa: {
      search_placeholder: 'ਕੋਈ ਵੀ ਜਗ੍ਹਾ ਲੱਭੋ…',
      locating: 'ਟਿਕਾਣਾ ਲੱਭ ਰਹੇ ਹਾਂ…',
      sign_in: 'ਸਾਈਨ ਇਨ',
      find_nearby: 'ਨੇੜੇ ਲੱਭੋ',
      hospitals: 'ਹਸਪਤਾਲ', restaurants: 'ਰੈਸਟੋਰੈਂਟ', atm: 'ਏਟੀਐਮ',
      pharmacy: 'ਦਵਾਈ ਦੀ ਦੁਕਾਨ', cafe: 'ਕੈਫੇ', petrol: 'ਪੈਟਰੋਲ', grocery: 'ਕਰਿਆਨਾ',
      park: 'ਪਾਰਕ', bank: 'ਬੈਂਕ', police: 'ਪੁਲਿਸ', hotel: 'ਹੋਟਲ',
      gym: 'ਜਿਮ', cinema: 'ਸਿਨੇਮਾ', library: 'ਲਾਇਬ੍ਰੇਰੀ', bus: 'ਬੱਸ ਸਟਾਪ',
      school: 'ਸਕੂਲ', dentist: 'ਦੰਦਾਂ ਦਾ ਡਾਕਟਰ', doctor: 'ਡਾਕਟਰ',
      restroom: 'ਟਾਇਲਟ', post: 'ਡਾਕਘਰ', parking: 'ਪਾਰਕਿੰਗ', worship: 'ਗੁਰਦੁਆਰਾ/ਮੰਦਰ',
      no_results: 'ਨੇੜੇ ਕੋਈ ਜਗ੍ਹਾ ਨਹੀਂ ਮਿਲੀ।',
      loading: 'ਨੇੜੇ ਦੀਆਂ ਜਗ੍ਹਾਂ ਲੱਭ ਰਹੇ ਹਾਂ…',
      directions: 'ਦਿਸ਼ਾ',
      save: 'ਸੇਵ',
      share: 'ਸ਼ੇਅਰ',
      call: 'ਕਾਲ',
      open_maps: 'ਮੈਪ ਵਿੱਚ ਖੋਲ੍ਹੋ',
      panic: '🆘 ਐਮਰਜੈਂਸੀ',
      trip_planner: 'ਯਾਤਰਾ ਯੋਜਨਾ',
      weather: 'ਮੌਸਮ',
      radius: 'ਦੂਰੀ',
      download_app: '📥 ਐਪ ਡਾਊਨਲੋਡ',
      choose_lang: '🌐 ਭਾਸ਼ਾ ਚੁਣੋ',
      km_away: 'ਕਿਮੀ ਦੂਰ',
      m_away: 'ਮੀਟਰ ਦੂਰ',
      open_now: 'ਹੁਣ ਖੁੱਲ੍ਹਾ',
      closed: 'ਬੰਦ',
      rate_place: 'ਰੇਟਿੰਗ ਦਿਓ',
      add_note: 'ਨੋਟ ਲਿਖੋ…',
      saved: 'ਸੇਵ ਹੋ ਗਿਆ!',
      location_error: 'ਟਿਕਾਣਾ ਨਹੀਂ ਮਿਲਿਆ। GPS ਚਾਲੂ ਕਰੋ।',
      search_results: 'ਖੋਜ ਨਤੀਜੇ',
      nearby: 'ਨੇੜੇ',
    },

    bn: {
      search_placeholder: 'যেকোনো জায়গা খুঁজুন…',
      locating: 'অবস্থান খুঁজছি…',
      sign_in: 'সাইন ইন',
      find_nearby: 'কাছে খুঁজুন',
      hospitals: 'হাসপাতাল', restaurants: 'রেস্তোরাঁ', atm: 'এটিএম',
      pharmacy: 'ফার্মেসি', cafe: 'ক্যাফে', petrol: 'পেট্রোল', grocery: 'মুদি',
      park: 'পার্ক', bank: 'ব্যাংক', police: 'পুলিশ', hotel: 'হোটেল',
      gym: 'জিম', cinema: 'সিনেমা', library: 'লাইব্রেরি', bus: 'বাস স্টপ',
      school: 'স্কুল', dentist: 'দাঁতের ডাক্তার', doctor: 'ডাক্তার',
      restroom: 'টয়লেট', post: 'ডাকঘর', parking: 'পার্কিং', worship: 'মন্দির/মসজিদ',
      no_results: 'কাছে কোনো জায়গা পাওয়া যায়নি।',
      loading: 'কাছের জায়গা খুঁজছি…',
      directions: 'পথনির্দেশ',
      save: 'সেভ',
      share: 'শেয়ার',
      call: 'কল',
      open_maps: 'ম্যাপে খুলুন',
      panic: '🆘 জরুরি',
      trip_planner: 'ট্রিপ পরিকল্পনা',
      weather: 'আবহাওয়া',
      radius: 'দূরত্ব',
      download_app: '📥 অ্যাপ ডাউনলোড',
      choose_lang: '🌐 ভাষা বেছে নিন',
      km_away: 'কিমি দূরে',
      m_away: 'মিটার দূরে',
      open_now: 'এখন খোলা',
      closed: 'বন্ধ',
      rate_place: 'রেটিং দিন',
      add_note: 'নোট লিখুন…',
      saved: 'সেভ হয়েছে!',
      location_error: 'অবস্থান পাওয়া যায়নি। GPS চালু করুন।',
      search_results: 'অনুসন্ধান ফলাফল',
      nearby: 'কাছাকাছি',
    },

    ta: {
      search_placeholder: 'எந்த இடத்தையும் தேடுங்கள்…',
      locating: 'இடத்தை கண்டுபிடிக்கிறோம்…',
      sign_in: 'உள்நுழைக',
      find_nearby: 'அருகில் தேடு',
      hospitals: 'மருத்துவமனை', restaurants: 'உணவகம்', atm: 'ஏடிஎம்',
      pharmacy: 'மருந்தகம்', cafe: 'காஃபே', petrol: 'பெட்ரோல்', grocery: 'மளிகை',
      park: 'பூங்கா', bank: 'வங்கி', police: 'போலீஸ்', hotel: 'ஹோட்டல்',
      gym: 'உடற்பயிற்சி', cinema: 'சினிமா', library: 'நூலகம்', bus: 'பேருந்து நிறுத்தம்',
      school: 'பள்ளி', dentist: 'பல் மருத்துவர்', doctor: 'மருத்துவர்',
      restroom: 'கழிவறை', post: 'தபால் அலுவலகம்', parking: 'நிறுத்துமிடம்', worship: 'கோவில்/மசூதி',
      no_results: 'அருகில் இடங்கள் கிடைக்கவில்லை.',
      loading: 'அருகிலுள்ள இடங்களைத் தேடுகிறோம்…',
      directions: 'வழிகாட்டி',
      save: 'சேமி',
      share: 'பகிர்',
      call: 'அழைப்பு',
      open_maps: 'வரைபடத்தில் திற',
      panic: '🆘 அவசரநிலை',
      trip_planner: 'பயண திட்டம்',
      weather: 'வானிலை',
      radius: 'தூரம்',
      download_app: '📥 செயலியை பதிவிறக்கு',
      choose_lang: '🌐 மொழியை தேர்ந்தெடு',
      km_away: 'கி.மீ தூரம்',
      m_away: 'மீட்டர் தூரம்',
      open_now: 'இப்போது திறந்திருக்கிறது',
      closed: 'மூடப்பட்டது',
      rate_place: 'மதிப்பீடு கொடு',
      add_note: 'குறிப்பு சேர்…',
      saved: 'சேமிக்கப்பட்டது!',
      location_error: 'இடத்தை கண்டுபிடிக்க முடியவில்லை. GPS இயக்குக.',
      search_results: 'தேடல் முடிவுகள்',
      nearby: 'அருகில்',
    },

    te: {
      search_placeholder: 'ఏదైనా స్థలం వెతకండి…',
      locating: 'స్థానం కనుగొంటున్నాం…',
      sign_in: 'సైన్ ఇన్',
      find_nearby: 'సమీపంలో వెతకండి',
      hospitals: 'ఆసుపత్రి', restaurants: 'రెస్టారెంట్', atm: 'ఏటీఎం',
      pharmacy: 'మందుల దుకాణం', cafe: 'కేఫ్', petrol: 'పెట్రోల్', grocery: 'కిరాణా',
      park: 'పార్క్', bank: 'బ్యాంక్', police: 'పోలీస్', hotel: 'హోటల్',
      gym: 'జిమ్', cinema: 'సినిమా', library: 'గ్రంథాలయం', bus: 'బస్ స్టాప్',
      school: 'పాఠశాల', dentist: 'దంత వైద్యుడు', doctor: 'వైద్యుడు',
      restroom: 'మరుగుదొడ్డి', post: 'పోస్ట్ ఆఫీస్', parking: 'పార్కింగ్', worship: 'దేవాలయం',
      no_results: 'సమీపంలో స్థలాలు కనుగొనబడలేదు.',
      loading: 'సమీప స్థలాలు వెతుకుతున్నాం…',
      directions: 'దిశలు',
      save: 'సేవ్',
      share: 'షేర్',
      call: 'కాల్',
      open_maps: 'మ్యాప్‌లో తెరవండి',
      panic: '🆘 అత్యవసరం',
      trip_planner: 'ట్రిప్ ప్లాన్నర్',
      weather: 'వాతావరణం',
      radius: 'దూరం',
      download_app: '📥 యాప్ డౌన్లోడ్',
      choose_lang: '🌐 భాష ఎంచుకోండి',
      km_away: 'కి.మీ దూరం',
      m_away: 'మీటర్ల దూరం',
      open_now: 'ఇప్పుడు తెరిచి ఉంది',
      closed: 'మూసివేయబడింది',
      rate_place: 'రేటింగ్ ఇవ్వండి',
      add_note: 'నోట్ జోడించండి…',
      saved: 'సేవ్ అయింది!',
      location_error: 'స్థానం కనుగొనబడలేదు. GPS ఆన్ చేయండి.',
      search_results: 'శోధన ఫలితాలు',
      nearby: 'సమీపంలో',
    },

    mr: {
      search_placeholder: 'कोणतीही जागा शोधा…',
      locating: 'स्थान शोधत आहोत…',
      sign_in: 'साइन इन',
      find_nearby: 'जवळपास शोधा',
      hospitals: 'रुग्णालय', restaurants: 'रेस्टॉरंट', atm: 'एटीएम',
      pharmacy: 'औषध दुकान', cafe: 'कॅफे', petrol: 'पेट्रोल', grocery: 'किराणा',
      park: 'उद्यान', bank: 'बँक', police: 'पोलीस', hotel: 'हॉटेल',
      gym: 'जिम', cinema: 'सिनेमा', library: 'ग्रंथालय', bus: 'बस थांबा',
      school: 'शाळा', dentist: 'दंतचिकित्सक', doctor: 'डॉक्टर',
      restroom: 'शौचालय', post: 'टपाल कार्यालय', parking: 'पार्किंग', worship: 'मंदिर/मशीद',
      no_results: 'जवळपास कोणतीही जागा सापडली नाही.',
      loading: 'जवळच्या जागा शोधत आहोत…',
      directions: 'दिशा',
      save: 'जतन करा',
      share: 'शेअर करा',
      call: 'कॉल करा',
      open_maps: 'नकाशात उघडा',
      panic: '🆘 आणीबाणी',
      trip_planner: 'ट्रिप प्लॅनर',
      weather: 'हवामान',
      radius: 'अंतर',
      download_app: '📥 अॅप डाउनलोड',
      choose_lang: '🌐 भाषा निवडा',
      km_away: 'किमी दूर',
      m_away: 'मीटर दूर',
      open_now: 'आता उघडे आहे',
      closed: 'बंद',
      rate_place: 'रेटिंग द्या',
      add_note: 'नोट लिहा…',
      saved: 'जतन झाले!',
      location_error: 'स्थान सापडले नाही. GPS चालू करा.',
      search_results: 'शोध निकाल',
      nearby: 'जवळपास',
    },
  };

  // ── Apply translations to DOM ──────────────────────────────────
  function applyLang(lang) {
    const t = T[lang] || T.en;
    localStorage.setItem(LANG_KEY, lang);

    // Update lang attribute
    document.documentElement.lang = lang === 'hinglish' ? 'hi' : lang;

    // Search placeholder
    const si = document.getElementById('header-search-input');
    if (si) si.placeholder = t.search_placeholder;

    // Location city default
    const lc = document.getElementById('location-city');
    if (lc && lc.textContent.includes('Locating')) lc.textContent = t.locating;

    // Auth button
    const ab = document.getElementById('auth-btn');
    if (ab && ab.textContent.trim() === 'Sign In' || ab?.textContent.trim() === T[getLang()]?.sign_in) {
      if (!window.NearMeAuth?.currentUser) ab.textContent = t.sign_in;
    }

    // Download button
    const db = document.querySelector('.download-header-btn');
    if (db) db.textContent = t.download_app;

    // Category labels — update sidebar & category chips
    const catMap = {
      hospital: t.hospitals, restaurant: t.restaurants, atm: t.atm,
      pharmacy: t.pharmacy, cafe: t.cafe, fuel: t.petrol,
      supermarket: t.grocery, park: t.park, bank: t.bank,
      police: t.police, hotel: t.hotel, gym: t.gym,
      cinema: t.cinema, library: t.library, bus_stop: t.bus,
      school: t.school, dentist: t.dentist, doctors: t.doctor,
      toilets: t.restroom, post_office: t.post, parking: t.parking, place_of_worship: t.worship,
    };
    document.querySelectorAll('[data-category]').forEach(el => {
      const cat = el.dataset.category;
      const label = el.querySelector('.cat-label, .cat-name, span:last-child, .sidebar-label');
      if (label && catMap[cat]) label.textContent = catMap[cat];
    });

    // Panic button
    const panic = document.getElementById('panic-btn') || document.querySelector('.panic-btn');
    if (panic) panic.innerHTML = t.panic;

    // Update language switcher active state
    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Dispatch event so app.js can use translations
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang, t } }));
  }

  function getLang() {
    return localStorage.getItem(LANG_KEY) || detectBrowserLang();
  }

  function detectBrowserLang() {
    const bl = (navigator.language || 'en').toLowerCase();
    if (bl.startsWith('hi')) return 'hi';
    if (bl.startsWith('pa')) return 'pa';
    if (bl.startsWith('bn')) return 'bn';
    if (bl.startsWith('ta')) return 'ta';
    if (bl.startsWith('te')) return 'te';
    if (bl.startsWith('mr')) return 'mr';
    return 'en';
  }

  // ── Init ───────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const currentLang = getLang();
    applyLang(currentLang);

    // Language dropdown toggle
    const langBtn = document.getElementById('lang-btn');
    const langDd  = document.getElementById('lang-dropdown');
    if (langBtn && langDd) {
      langBtn.addEventListener('click', e => {
        e.stopPropagation();
        langDd.classList.toggle('open');
      });
      document.addEventListener('click', () => langDd.classList.remove('open'));

      // Language option click
      document.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          applyLang(btn.dataset.lang);
          langDd.classList.remove('open');
          // Show toast
          const names = {en:'English',hi:'हिंदी',hinglish:'Hinglish',pa:'ਪੰਜਾਬੀ',bn:'বাংলা',ta:'தமிழ்',te:'తెలుగు',mr:'मराठी'};
          if (window.toast) window.toast('🌐 Language: ' + names[btn.dataset.lang]);
        });
      });
    }
  });

  // ── Public API ─────────────────────────────────────────────────
  window.NearMeLang = {
    t:      (key) => (T[getLang()] || T.en)[key] || (T.en)[key] || key,
    get:    getLang,
    set:    applyLang,
    all:    T,
  };
})();
