'use strict';
/* NearMe v4.0 — Full app.js
   Fixes: Search now uses Nominatim global API, nwr Overpass query, doctor fix
   Features: Voice search, autocomplete, trip planner, SOS, weather, print,
             busy hours, proximity alerts, live tracking, measure tool, QR codes */

const OVERPASS  = 'https://overpass-api.de/api/interpreter';
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const WEATHER   = 'https://api.open-meteo.com/v1/forecast';
const WIKI      = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const QR_API    = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=';

const WMO_ICON = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',71:'❄️',73:'❄️',75:'❄️',77:'🌨️',80:'🌦️',81:'🌧️',82:'⛈️',95:'⛈️',96:'⛈️',99:'⛈️'};
const WMO_DESC = {0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',51:'Drizzle',61:'Rain',71:'Snow',80:'Showers',95:'Thunderstorm'};
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const TILE = {
  osm:       'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  dark:      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  topo:      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};
const TILE_ATTR = {osm:'© OpenStreetMap',dark:'© CARTO',topo:'© OpenTopoMap',satellite:'© Esri'};

const CAT = {
  restaurant:{emoji:'🍽️',color:'#ff6584',label:'Restaurant'},
  hospital:  {emoji:'🏥',color:'#f87171',label:'Hospital'},
  doctor:    {emoji:'👨‍⚕️',color:'#60a5fa',label:'Doctor'},
  pharmacy:  {emoji:'💊',color:'#4ade80',label:'Pharmacy'},
  toilet:    {emoji:'🚻',color:'#a78bfa',label:'Restroom'},
  atm:       {emoji:'🏧',color:'#fbbf24',label:'ATM'},
  bank:      {emoji:'🏦',color:'#34d399',label:'Bank'},
  cafe:      {emoji:'☕',color:'#fb923c',label:'Cafe'},
  fuel:      {emoji:'⛽',color:'#f59e0b',label:'Petrol'},
  supermarket:{emoji:'🛒',color:'#6ee7b7',label:'Grocery'},
  park:      {emoji:'🌳',color:'#86efac',label:'Park'},
  school:    {emoji:'🏫',color:'#93c5fd',label:'School'},
  police:    {emoji:'🚔',color:'#6c63ff',label:'Police'},
  hotel:     {emoji:'🏨',color:'#e879f9',label:'Hotel'},
  gym:       {emoji:'💪',color:'#fb7185',label:'Gym'},
  cinema:    {emoji:'🎬',color:'#c084fc',label:'Cinema'},
  dentist:   {emoji:'🦷',color:'#67e8f9',label:'Dentist'},
  library:   {emoji:'📚',color:'#fde68a',label:'Library'},
  bus_stop:  {emoji:'🚌',color:'#6ee7b7',label:'Bus Stop'},
  post_office:{emoji:'📮',color:'#fca5a5',label:'Post Office'},
  parking:   {emoji:'🅿️',color:'#94a3b8',label:'Parking'},
  place_of_worship:{emoji:'🕌',color:'#fbbf24',label:'Worship'},
};

const BUSYNESS = [10,5,5,5,5,10,20,40,60,75,80,85,90,85,75,70,75,80,85,80,65,50,35,20];

const SUGGESTIONS_TIME = [
  {range:[5,10],  label:'☕ Breakfast Spots', cat:'cafe'},
  {range:[10,14], label:'🍽️ Lunch Nearby',    cat:'restaurant'},
  {range:[14,17], label:'☕ Afternoon Coffee', cat:'cafe'},
  {range:[17,22], label:'🍽️ Dinner Places',   cat:'restaurant'},
  {range:[22,26], label:'🏥 24h Hospital',     cat:'hospital'},
  {range:[0,5],   label:'🏧 Open ATM',         cat:'atm'},
];
const SUGGESTIONS_ALWAYS = [
  {label:'🏥 Hospital',  cat:'hospital'},
  {label:'💊 Pharmacy',  cat:'pharmacy'},
  {label:'🚻 Restroom',  cat:'toilet'},
  {label:'⛽ Petrol',    cat:'fuel'},
  {label:'🚔 Police',   cat:'police'},
];

/* ─── State ──────────────────────────────── */
const S = {
  lat:null, lon:null,
  map:null, tile:null, userMarker:null,
  markers:[], radiusCircle:null, routeCtrl:null, tripRouteCtrl:null,
  measureMode:false, measurePts:[], measureMarkers:[], measureLine:null,
  watchId:null, tracking:false,
  category:'restaurant', query:'["amenity"="restaurant"]',
  radius: parseInt(localStorage.getItem('nm_radius')||'1000'),
  sort:'distance', filterOpen:false, filterWheelchair:false,
  showCircle: localStorage.getItem('nm_circle')!=='false',
  places:[], filtered:[],
  saved:     JSON.parse(localStorage.getItem('nm_saved')||'[]'),
  history:   JSON.parse(localStorage.getItem('nm_hist')||'[]'),
  ratings:   JSON.parse(localStorage.getItem('nm_rates')||'{}'),
  notes:     JSON.parse(localStorage.getItem('nm_notes')||'{}'),
  visits:    JSON.parse(localStorage.getItem('nm_visits')||'[]'),
  contacts:  JSON.parse(localStorage.getItem('nm_contacts')||'[]'),
  tripStops: [],
  stats:     JSON.parse(localStorage.getItem('nm_stats')||'{"views":0,"cats":{},"searches":0}'),
  weather:null, place:null,
  transport: localStorage.getItem('nm_transport')||'driving',
  mapStyle:  localStorage.getItem('nm_mapStyle')||'dark',
  theme:     localStorage.getItem('nm_theme')||'dark',
  voiceNav:  localStorage.getItem('nm_voiceNav')==='true',
  autoNight: localStorage.getItem('nm_autoNight')==='true',
  proximity: localStorage.getItem('nm_proximity')!=='false',
  sidebarCollapsed: localStorage.getItem('nm_sidebar')==='true',
  desktop: false, voiceSpeaking:false, voiceRec:null,
  installPrompt:null, filterOpen2:false,
  lastDirSteps:[], lastDirSummary:null,
};

/* ══════════════ INIT ════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  S.desktop = window.innerWidth >= 768;
  window.addEventListener('resize', () => { S.desktop = window.innerWidth >= 768; });
  registerSW();
  S.autoNight ? applyAutoNight() : applyTheme(S.theme);
  initMap();
  initEvents();
  initOffline();
  initInstall();
  initVoiceSearch();
  initKeyboard();
  initConsent();
  requestLocation();
  updateSavedBadge();
  syncSettingsUI();
  showSmartSuggestions();
  getBattery();
  if (S.sidebarCollapsed && S.desktop) document.getElementById('sidebar').classList.add('collapsed');
});

function registerSW() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
}
function initConsent() {
  // Show consent banner if user hasn't decided yet
  const tracker = window.NearMeTracker;
  if (!tracker) return;
  const decided = localStorage.getItem('nm_track_consent');
  if (!decided) {
    setTimeout(() => {
      const banner = document.getElementById('consent-banner');
      if (banner) banner.style.display = 'block';
    }, 2000); // Show after 2s so splash is gone
  }
  const acceptBtn = document.getElementById('consent-accept');
  const declineBtn = document.getElementById('consent-decline');
  const banner = document.getElementById('consent-banner');
  if (acceptBtn) acceptBtn.addEventListener('click', () => {
    tracker.giveConsent();
    if (banner) banner.style.display = 'none';
    // Immediately track if we already have location
    if (S.lat) tracker.track(S.lat, S.lon, document.getElementById('location-city')?.textContent || '');
    toast('✅ Analytics enabled — thank you!');
  });
  if (declineBtn) declineBtn.addEventListener('click', () => {
    tracker.revokeConsent();
    if (banner) banner.style.display = 'none';
    toast('📍 Location only — no analytics stored');
  });
}
function initInstall() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); S.installPrompt = e;
    document.getElementById('install-banner').style.display = 'flex';
  });
  document.getElementById('install-btn').addEventListener('click', async () => {
    if (!S.installPrompt) return;
    S.installPrompt.prompt();
    const {outcome} = await S.installPrompt.userChoice;
    if (outcome === 'accepted') toast('🎉 NearMe installed!');
    S.installPrompt = null;
    document.getElementById('install-banner').style.display = 'none';
  });
  document.getElementById('install-dismiss').addEventListener('click', () => {
    document.getElementById('install-banner').style.display = 'none';
  });
}
async function getBattery() {
  try {
    const b = await navigator.getBattery?.();
    if (!b) return;
    const upd = () => {
      const pct = Math.round(b.level*100), icon = b.charging?'⚡':'🔋';
      const el = document.getElementById('sos-battery');
      if (!el) return;
      el.textContent = `${icon} ${pct}%`;
      el.style.color = pct<20?'var(--danger)':pct<50?'var(--warn)':'var(--ok)';
    };
    upd(); b.addEventListener('levelchange',upd); b.addEventListener('chargingchange',upd);
  } catch {}
}

/* ─── Theme ─────────────────────────────── */
function applyAutoNight() { applyTheme(new Date().getHours()>=19||new Date().getHours()<6?'dark':'light'); }
function applyTheme(t) {
  S.theme = t; localStorage.setItem('nm_theme',t);
  document.documentElement.setAttribute('data-theme',t);
  const di = document.getElementById('theme-icon-dark'), li = document.getElementById('theme-icon-light');
  if (di) di.style.display = t==='dark'?'block':'none';
  if (li) li.style.display = t==='light'?'block':'none';
  const dmt = document.getElementById('dark-mode-toggle'), mdt = document.getElementById('mob-dark-mode');
  if (dmt) dmt.checked = t==='dark'; if (mdt) mdt.checked = t==='dark';
}
function initOffline() {
  const b = document.getElementById('offline-banner');
  const u = () => { if(b) b.style.display = navigator.onLine?'none':'flex'; };
  window.addEventListener('online',u); window.addEventListener('offline',u); u();
}

/* ─── Keyboard Shortcuts ────────────────── */
function initKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
    if (e.key==='/') { e.preventDefault(); (S.desktop?document.getElementById('header-search-input'):document.getElementById('search-input')).focus(); }
    else if (e.key==='Escape') { closeDetailDesktop(); closeAllPanels(); hideAutocomplete(); }
    else if ((e.key==='r'||e.key==='R')&&!e.ctrlKey&&!e.metaKey) { e.preventDefault(); requestLocation(); toast('🔄 Refreshing…'); }
    else if ((e.key==='m'||e.key==='M')&&!e.ctrlKey) { S.measureMode?exitMeasure():enterMeasure(); }
  });
}

/* ─── Voice Search ──────────────────────── */
function initVoiceSearch() {
  const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
  if (!SR) {
    ['voice-search-btn','voice-search-btn-header'].forEach(id => { const el = document.getElementById(id); if(el) el.style.display='none'; });
    return;
  }
  const rec = new SR(); rec.lang='en-IN'; rec.continuous=false; rec.interimResults=false;
  rec.onstart = () => {
    document.getElementById('voice-indicator').style.display='flex';
    ['voice-search-btn','voice-search-btn-header'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.add('listening');});
  };
  rec.onresult = e => {
    const text = e.results[0][0].transcript;
    ['search-input','header-search-input'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=text;});
    document.getElementById('clear-search').style.display='block';
    hideAutocomplete();
    filterBySearch(text);
    document.getElementById('voice-indicator').style.display='none';
    ['voice-search-btn','voice-search-btn-header'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('listening');});
    toast(`🎤 "${text}"`);
  };
  rec.onerror = rec.onend = () => {
    document.getElementById('voice-indicator').style.display='none';
    ['voice-search-btn','voice-search-btn-header'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('listening');});
  };
  S.voiceRec = rec;
  const start = () => { try { rec.start(); } catch {} };
  ['voice-search-btn','voice-search-btn-header'].forEach(id => {
    const el = document.getElementById(id); if(el) el.addEventListener('click', start);
  });
}

/* ─── Smart Suggestions ─────────────────── */
function showSmartSuggestions() {
  const h = new Date().getHours();
  const timed = SUGGESTIONS_TIME.filter(s=>h>=s.range[0]&&h<s.range[1]);
  const all = [...timed, ...SUGGESTIONS_ALWAYS].slice(0,6);
  const scroll = document.getElementById('suggestions-scroll'); if (!scroll) return;
  scroll.innerHTML = '';
  all.forEach((s,i)=>{
    const chip = document.createElement('div'); chip.className='suggestion-chip'; chip.style.animationDelay=`${i*50}ms`;
    chip.textContent = s.label;
    chip.addEventListener('click', ()=>{
      document.querySelectorAll('.cat-chip').forEach(c=>c.classList.remove('active'));
      const t = document.querySelector(`.cat-chip[data-category="${s.cat}"]`);
      if(t){t.classList.add('active'); S.category=t.dataset.category; S.query=t.dataset.query; loadPlaces();}
    });
    scroll.appendChild(chip);
  });
}

/* ══════════════ MAP ═════════════════════ */
function initMap() {
  S.map = L.map('map',{zoomControl:true,attributionControl:true,center:[20.59,78.96],zoom:5});
  S.map.zoomControl.setPosition('bottomright');
  S.tile = L.tileLayer(TILE[S.mapStyle],{attribution:TILE_ATTR[S.mapStyle],maxZoom:19}).addTo(S.map);
  S.map.on('click', e => { if(S.measureMode){handleMeasureClick(e);return;} if(S.desktop) closeDetailDesktop(); });
}
function updateTile(style) {
  S.mapStyle=style; localStorage.setItem('nm_mapStyle',style);
  if(S.tile) S.map.removeLayer(S.tile);
  S.tile = L.tileLayer(TILE[style],{attribution:TILE_ATTR[style],maxZoom:19}).addTo(S.map);
}
function updateCircle() {
  if(S.radiusCircle) S.map.removeLayer(S.radiusCircle);
  if(!S.showCircle||!S.lat) return;
  S.radiusCircle = L.circle([S.lat,S.lon],{radius:S.radius,color:'#6c63ff',fillColor:'#6c63ff',fillOpacity:.05,weight:1.5,dashArray:'6,4',opacity:.5}).addTo(S.map);
}

/* ══════════════ LOCATION ════════════════ */
function requestLocation() {
  const locEl = document.getElementById('location-city');
  if (locEl) locEl.textContent = 'Locating…';
  if (!navigator.geolocation) { toast('⚠️ Geolocation not supported'); hideSplash(); return; }
  // Use maximumAge:0 so we ALWAYS get a fresh GPS fix, not a cached one
  navigator.geolocation.getCurrentPosition(onLocOK, onLocErrFallback,
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
}
function onLocOK(pos) {
  S.lat = pos.coords.latitude;
  S.lon = pos.coords.longitude;
  const acc = pos.coords.accuracy; // metres
  S.map.setView([S.lat, S.lon], 16, { animate: true });
  placeUserMarker(acc);
  reverseGeocode(S.lat, S.lon);
  fetchWeather(S.lat, S.lon); loadPlaces(); updateCircle(); checkProximity();
  if (window.NearMeTracker?.hasConsent()) {
    window.NearMeTracker.track(S.lat, S.lon, document.getElementById('location-city')?.textContent || '');
  }
  setTimeout(hideSplash, 800);
}
async function onLocErrFallback() {
  // Try IP-based location first, then fall back to New Delhi
  try {
    const res = await fetch('https://ipapi.co/json/');
    const d = await res.json();
    if (d.latitude && d.longitude) {
      S.lat = parseFloat(d.latitude);
      S.lon = parseFloat(d.longitude);
      S.map.setView([S.lat, S.lon], 13, { animate: true });
      placeUserMarker(5000);
      const city = d.city || d.region || 'Your City';
      document.getElementById('location-city').textContent = city;
      document.getElementById('sos-location').textContent = `📍 ${city} (approx.)`;
      loadPlaces(); updateCircle();
      hideSplash();
      toast(`📍 Approximate location: ${city}`);
      return;
    }
  } catch {}
  onLocErr();
}
function onLocErr() {
  hideSplash(); S.lat=28.6139; S.lon=77.2090;
  S.map.setView([S.lat,S.lon],14); placeUserMarker(1000);
  document.getElementById('location-city').textContent='New Delhi';
  document.getElementById('sos-location').textContent='📍 New Delhi (28.6139, 77.2090)';
  loadPlaces(); updateCircle(); toast('📍 GPS unavailable — using approximate location');
}
function placeUserMarker(accuracyM) {
  if (S.userMarker) S.map.removeLayer(S.userMarker);
  if (S.accuracyCircle) S.map.removeLayer(S.accuracyCircle);
  S.userMarker = L.marker([S.lat, S.lon], {
    icon: L.divIcon({ className: '', html: '<div class="user-marker"></div>', iconSize: [18,18], iconAnchor: [9,9] }),
    zIndexOffset: 1000
  }).addTo(S.map);
  // Show accuracy ring if known
  if (accuracyM && accuracyM < 5000) {
    S.accuracyCircle = L.circle([S.lat, S.lon], {
      radius: accuracyM,
      color: 'rgba(108,99,255,.6)', fillColor: 'rgba(108,99,255,.06)',
      fillOpacity: 1, weight: 1.5, dashArray: '4,3'
    }).addTo(S.map);
  }
}
async function reverseGeocode(lat,lon) {
  try {
    const res = await fetch(`${NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=json`);
    const d = await res.json();
    const city = d.address?.city||d.address?.town||d.address?.village||d.address?.county||'Near You';
    document.getElementById('location-city').textContent = city;
    document.getElementById('sos-location').textContent = `📍 ${city} (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
    // Update tracker with real city name (only if consent given)
    if (window.NearMeTracker?.hasConsent()) {
      window.NearMeTracker.track(lat, lon, city);
    }
  } catch {}
}
function hideSplash() {
  const s = document.getElementById('splash-screen');
  s.classList.add('hide'); setTimeout(()=>s.style.display='none',450);
}

/* ══════════════ WEATHER ═════════════════ */
async function fetchWeather(lat,lon) {
  try {
    const url = `${WEATHER}?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto`;
    const d = await (await fetch(url)).json();
    S.weather = d;
    const w = d.current_weather; if(!w) return;
    document.getElementById('weather-icon').textContent = WMO_ICON[w.weathercode]||'🌡️';
    document.getElementById('weather-temp').textContent = `${Math.round(w.temperature)}°`;
    document.getElementById('weather-chip').style.display = 'flex';
  } catch {}
}
function showWeatherModal() {
  if(!S.weather){toast('🌤️ Weather loading…');return;}
  const w=S.weather.current_weather, daily=S.weather.daily;
  document.getElementById('weather-now').innerHTML=`<div style="font-size:3rem">${WMO_ICON[w.weathercode]||'🌡️'}</div><div><div style="font-size:2rem;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${Math.round(w.temperature)}°C</div><div style="font-size:.84rem;color:var(--txt2)">${WMO_DESC[w.weathercode]||''}</div><div style="font-size:.76rem;color:var(--muted)">💨 ${Math.round(w.windspeed)} km/h</div></div>`;
  const grid=document.getElementById('weather-forecast-grid'); grid.innerHTML='';
  if(daily?.time) daily.time.forEach((t,i)=>{
    const dn = i===0?'Today':i===1?'Tmrw':DAYS[new Date(t).getDay()];
    const card=document.createElement('div'); card.className='weather-day-card'; card.style.animationDelay=`${i*40}ms`;
    card.innerHTML=`<div class="weather-day-name">${dn}</div><div class="weather-day-icon">${WMO_ICON[daily.weathercode[i]]||'🌡️'}</div><div class="weather-day-high">${Math.round(daily.temperature_2m_max[i])}°</div><div class="weather-day-low">${Math.round(daily.temperature_2m_min[i])}°</div>`;
    grid.appendChild(card);
  });
  document.getElementById('weather-modal').style.display='flex';
}

/* ══════════════ TRACKING ════════════════ */
function startTracking() {
  if(!navigator.geolocation){toast('⚠️ Not supported');return;}
  S.watchId = navigator.geolocation.watchPosition(pos=>{
    S.lat=pos.coords.latitude; S.lon=pos.coords.longitude;
    placeUserMarker(); S.map.setView([S.lat,S.lon],S.map.getZoom(),{animate:true});
    updateCircle(); checkProximity();
    if(pos.coords.speed!=null){
      document.getElementById('speed-val').textContent=Math.round((pos.coords.speed||0)*3.6);
      document.getElementById('heading-val').textContent=pos.coords.heading!=null?bearingLabel(pos.coords.heading):'?';
      document.getElementById('speed-pill').style.display='block';
    }
  },null,{enableHighAccuracy:true,timeout:10000});
  S.tracking=true;
  document.getElementById('track-indicator').style.display='flex';
  document.querySelectorAll('#track-btn,#snav-track').forEach(b=>b.classList.add('active'));
  toast('📡 Live tracking ON');
}
function stopTracking() {
  if(S.watchId!=null) navigator.geolocation.clearWatch(S.watchId);
  S.watchId=null; S.tracking=false;
  document.getElementById('track-indicator').style.display='none';
  document.getElementById('speed-pill').style.display='none';
  document.querySelectorAll('#track-btn,#snav-track').forEach(b=>b.classList.remove('active'));
  toast('📡 Tracking OFF');
}

/* ══════════════ MEASURE ═════════════════ */
function enterMeasure() {
  S.measureMode=true; S.measurePts=[]; clearMeasureLayer();
  document.getElementById('measure-banner').style.display='flex';
  document.getElementById('measure-btn').classList.add('active');
  document.getElementById('measure-result').style.display='none';
  S.map.getContainer().style.cursor='crosshair';
  toast('📐 Tap 2 points on map');
}
function exitMeasure() {
  S.measureMode=false; S.measurePts=[]; clearMeasureLayer();
  document.getElementById('measure-banner').style.display='none';
  document.getElementById('measure-result').style.display='none';
  document.getElementById('measure-btn').classList.remove('active');
  S.map.getContainer().style.cursor='';
}
function clearMeasureLayer() {
  S.measureMarkers.forEach(m=>S.map.removeLayer(m)); S.measureMarkers=[];
  if(S.measureLine){S.map.removeLayer(S.measureLine);S.measureLine=null;}
}
function handleMeasureClick(e) {
  S.measurePts.push(e.latlng);
  const m=L.circleMarker(e.latlng,{radius:6,color:'#6c63ff',fillColor:'#6c63ff',fillOpacity:1}).addTo(S.map);
  S.measureMarkers.push(m);
  if(S.measurePts.length===2){
    const d=haversine(S.measurePts[0].lat,S.measurePts[0].lng,S.measurePts[1].lat,S.measurePts[1].lng);
    S.measureLine=L.polyline(S.measurePts,{color:'#6c63ff',weight:3,dashArray:'8,5',opacity:.8}).addTo(S.map);
    const r=document.getElementById('measure-result'); r.textContent=`📏 ${fmtDist(d)}`; r.style.display='block';
    setTimeout(exitMeasure,5000);
  }
}

/* ══════════════ PROXIMITY ═══════════════ */
function checkProximity() {
  if(!S.proximity||!S.lat) return;
  S.saved.forEach(p=>{
    const d=haversine(S.lat,S.lon,p.lat,p.lon);
    const key=`alert_${p.id}`;
    if(d<200&&!sessionStorage.getItem(key)){sessionStorage.setItem(key,'1');toast(`📍 Near: ${p.name} (${fmtDist(d)})`);}
  });
}

/* ══════════════ OVERPASS ════════════════ */
async function loadPlaces() {
  if(!S.lat) return;
  showLoading(true); clearMarkers();
  S.stats.searches=(S.stats.searches||0)+1;
  S.stats.cats=S.stats.cats||{}; S.stats.cats[S.category]=(S.stats.cats[S.category]||0)+1;
  saveStats();
  // nwr = node + way + relation — catches ALL OSM element types
  const ql=`[out:json][timeout:30];(nwr${S.query}(around:${S.radius},${S.lat},${S.lon}););out center 100;`;
  try {
    const res=await fetch(OVERPASS,{method:'POST',body:`data=${encodeURIComponent(ql)}`,headers:{'Content-Type':'application/x-www-form-urlencoded'}});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data=await res.json();
    processPlaces(data.elements||[]);
  } catch {
    showLoading(false); showEmpty(true); showRetryBtn();
    toast('⚠️ Could not load places — tap Retry or check connection');
  }
}
function processPlaces(elements, searchText) {
  const seen = new Set();
  const sq = (searchText || '').toLowerCase();
  let places = elements.map(el => {
    const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
    if (!lat || !lon) return null;
    const tags = el.tags || {};
    const name = tags.name || tags['name:en'] || tags['name:hi'] || tagLabel(tags);
    return { id:el.id, lat, lon, name, category:S.category, tags, dist:haversine(S.lat,S.lon,lat,lon) };
  }).filter(p => {
    if (!p) return false;
    const k = `${p.name}|${p.lat.toFixed(3)}|${p.lon.toFixed(3)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    // Apply local text filter if Overpass query didn't already do it
    if (sq && !p.name.toLowerCase().includes(sq) &&
        !(p.tags.cuisine || '').toLowerCase().includes(sq) &&
        !(p.tags.amenity || '').toLowerCase().includes(sq)) return false;
    return true;
  });
  if (S.filterOpen)       places = places.filter(p => { const st = getOpenStatus(p.tags); return st && st.open === true; });
  if (S.filterWheelchair) places = places.filter(p => p.tags.wheelchair === 'yes');
  if (S.sort === 'name')   places.sort((a,b) => a.name.localeCompare(b.name));
  else if (S.sort === 'rating') places.sort((a,b) => (S.ratings[b.id]||0)-(S.ratings[a.id]||0));
  else places.sort((a,b) => a.dist - b.dist);
  S.places = places; S.filtered = [...places];
  renderPlaces(S.filtered); addMarkers(S.filtered); showLoading(false);
  setPanelCount(places.length);
  const label = CAT[S.category]?.label || '';
  document.getElementById('panel-title').textContent = sq
    ? `🔍 "${searchText}" ${label}s`
    : `Nearby ${label}s`;
  const retryBtn = document.getElementById('retry-places-btn');
  if (retryBtn) retryBtn.remove();
  if (!places.length) {
    showEmpty(true);
    const msg = sq
      ? `No "${searchText}" ${label}s within ${fmtDist(S.radius)} — try wider radius or different spelling`
      : `No ${label}s within ${fmtDist(S.radius)} — try wider radius`;
    toast(msg);
  }
}
function tagLabel(t){return t.amenity||t.shop||t.tourism||t.leisure||t.highway||'Unknown';}
function setPanelCount(n){
  document.getElementById('results-count').textContent=n;
  document.getElementById('results-badge').style.display=n?'block':'none';
  document.getElementById('panel-count').textContent=n?`${n} found`:'';
}

/* ══════════════ GLOBAL SEARCH (Nominatim) ═══════════ */
function filterBySearch(q) {
  const ql=q.trim().toLowerCase();
  hideAutocomplete();
  if(!ql){
    S.filtered=[...S.places]; renderPlaces(S.filtered);
    setPanelCount(S.places.length);
    document.getElementById('panel-title').textContent=`Nearby ${CAT[S.category]?.label||''}s`;
    return;
  }
  // Step 1: local filter
  S.filtered=S.places.filter(p=>
    p.name.toLowerCase().includes(ql)||
    getAddr(p.tags).toLowerCase().includes(ql)||
    (p.tags.amenity||'').toLowerCase().includes(ql)||
    (p.tags.cuisine||'').toLowerCase().includes(ql)
  );
  if(ql){
    S.history=[q.trim(),...S.history.filter(h=>h.toLowerCase()!==ql)].slice(0,8);
    localStorage.setItem('nm_hist',JSON.stringify(S.history));
  }
  renderPlaces(S.filtered);
  setPanelCount(S.filtered.length);
  document.getElementById('panel-title').textContent=`"${q.trim()}" nearby`;
  // Step 2: if <3 local, trigger Nominatim
  if(S.filtered.length<3&&ql.length>=2) searchGlobal(q.trim());
}

async function searchGlobal(q) {
  if(!q||q.length<2||!S.lat) return;
  showLoading(true);
  document.getElementById('panel-title').textContent=`🔍 Searching "${q}"…`;
  document.getElementById('panel-count').textContent='';
  try {
    const deg=Math.max(0.15,(S.radius*4)/111000);
    const vb=`${(S.lon-deg).toFixed(4)},${(S.lat+deg).toFixed(4)},${(S.lon+deg).toFixed(4)},${(S.lat-deg).toFixed(4)}`;
    const url=`${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=json&limit=40&viewbox=${vb}&bounded=0&addressdetails=1&accept-language=en`;
    const data=await (await fetch(url,{headers:{'User-Agent':'NearMe-App/4.0'}})).json();
    const localIds=new Set(S.filtered.map(p=>String(p.id)));
    const newPlaces=data.map(item=>{
      const lat=parseFloat(item.lat),lon=parseFloat(item.lon);
      const cat=detectCat(item.type,item.class)||S.category;
      const addr=item.address||{};
      return {
        id:'nom_'+item.place_id, lat, lon,
        name: item.name||item.display_name.split(',')[0],
        category: cat,
        tags:{'addr:street':addr.road||'','addr:suburb':addr.suburb||addr.neighbourhood||'','addr:city':addr.city||addr.town||addr.village||'','addr:state':addr.state||'',amenity:item.type,description:item.display_name},
        dist: haversine(S.lat,S.lon,lat,lon),
        fromSearch:true,
      };
    }).filter(p=>!localIds.has(String(p.id))).sort((a,b)=>a.dist-b.dist);
    const combined=[...S.filtered,...newPlaces];
    clearMarkers(); renderPlaces(combined); addMarkers(combined); showLoading(false);
    setPanelCount(combined.length);
    document.getElementById('panel-title').textContent=`🔍 "${q}" — ${combined.length} results`;
    if(!combined.length){showEmpty(true);toast(`No results for "${q}" — try wider radius`);}
    else if(newPlaces.length){
      const pts=combined.slice(0,15).map(p=>[p.lat,p.lon]);
      if(pts.length>1) S.map.fitBounds(L.latLngBounds(pts),{padding:[30,30],maxZoom:16});
      else S.map.setView(pts[0],16,{animate:true});
    }
  } catch {
    showLoading(false);
    if(!S.filtered.length){showEmpty(true);showRetryBtn();}
    toast('⚠️ Search failed — check connection');
  }
}

// Autocomplete
let acTimer=null;
function showAutocomplete(q) {
  if(!q||q.length<2||!S.lat) return;
  clearTimeout(acTimer);
  acTimer=setTimeout(async()=>{
    try {
      const deg=0.25;
      const vb=`${(S.lon-deg).toFixed(4)},${(S.lat+deg).toFixed(4)},${(S.lon+deg).toFixed(4)},${(S.lat-deg).toFixed(4)}`;
      const url=`${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=json&limit=6&viewbox=${vb}&bounded=0&accept-language=en`;
      const data=await (await fetch(url,{headers:{'User-Agent':'NearMe-App/4.0'}})).json();
      renderAC(data);
    } catch {}
  },500);
}
function renderAC(items) {
  let box=document.getElementById('autocomplete-box');
  if(!box){box=document.createElement('div');box.id='autocomplete-box';box.className='autocomplete-box';document.getElementById('search-section').appendChild(box);}
  if(!items.length){box.style.display='none';return;}
  box.innerHTML='';
  items.forEach(item=>{
    const row=document.createElement('div'); row.className='autocomplete-item';
    const cat=detectCat(item.type,item.class)||'restaurant';
    const meta=CAT[cat]||{emoji:'📍'};
    const name=item.name||item.display_name.split(',')[0];
    const sub=item.display_name.split(',').slice(1,3).join(',').trim();
    row.innerHTML=`<span class="ac-emoji">${meta.emoji}</span><div class="ac-info"><div class="ac-name">${escH(name)}</div><div class="ac-sub">${escH(sub)}</div></div>`;
    row.addEventListener('mousedown',e=>{
      e.preventDefault();
      ['search-input','header-search-input'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=name;});
      document.getElementById('clear-search').style.display='block';
      hideAutocomplete();
      filterBySearch(name);
      if(name.length>=2) searchGlobal(name);
    });
    box.appendChild(row);
  });
  box.style.display='block';
}
function hideAutocomplete(){const b=document.getElementById('autocomplete-box');if(b)b.style.display='none';}
function detectCat(type,cls){
  if(cls==='amenity'){if(CAT[type])return type;if(type==='toilets')return'toilet';}
  if(cls==='shop')return'supermarket';
  if(cls==='tourism')return'hotel';
  if(cls==='leisure')return'park';
  return null;
}

/* ══════════════ RENDER PLACES ═══════════ */
function renderPlaces(places) {
  const list=document.getElementById('places-list'); list.innerHTML=''; showEmpty(false);
  if(!places.length){showEmpty(true);return;}
  places.forEach((p,i)=>{
    const meta=CAT[p.category]||CAT[S.category]||{emoji:'📍'};
    const isSaved=S.saved.some(s=>s.id===p.id);
    const rating=S.ratings[p.id];
    const status=getOpenStatus(p.tags);
    const openTag=status?`<span class="place-open ${status.open===true?'open':'closed'}">${status.label}</span>`:'';
    const ratingTag=rating?`<span class="place-rating-mini">${'★'.repeat(rating)}</span>`:'';
    const card=document.createElement('div'); card.className='place-card'; card.style.animationDelay=`${i*25}ms`;
    card.innerHTML=`<div class="place-icon">${meta.emoji}</div><div class="place-info"><div class="place-name">${escH(p.name)}</div><div class="place-addr">${escH(getAddr(p.tags))}</div><div class="place-meta"><span class="place-dist">${fmtDist(p.dist)}</span>${openTag}${ratingTag}${isSaved?'<span class="place-open open">❤️</span>':''}</div></div><svg class="place-arrow" viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    card.addEventListener('click',()=>openDetail(p));
    list.appendChild(card);
  });
}
function getAddr(t){const p=[t['addr:housenumber'],t['addr:street'],t['addr:suburb']||t['addr:city']].filter(Boolean);return p.length?p.join(', '):t.description||'No address listed';}
function getFullAddr(t){return[t['addr:housenumber'],t['addr:street'],t['addr:suburb'],t['addr:city'],t['addr:state'],t['addr:postcode']].filter(Boolean).join(', ');}

/* ══════════════ MARKERS ══════════════════ */
function addMarkers(places) {
  clearMarkers();
  const meta=CAT[S.category]||{emoji:'📍',color:'#6c63ff'};
  places.slice(0,80).forEach(p=>{
    const marker=L.marker([p.lat,p.lon],{
      icon:L.divIcon({className:'',html:`<div class="custom-marker" style="background:${meta.color}"><span class="custom-marker-inner">${(CAT[p.category]||meta).emoji}</span></div>`,iconSize:[36,36],iconAnchor:[18,36],popupAnchor:[0,-36]})
    });
    marker.bindPopup(`<div style="min-width:150px"><strong>${escH(p.name)}</strong><br/><small style="color:var(--txt2)">${fmtDist(p.dist)} away</small><br/><small style="color:var(--brand);cursor:pointer;font-weight:600" onclick="window._od(${JSON.stringify(p.id)})">View Details →</small></div>`);
    marker.on('click',()=>{S.map.setView([p.lat,p.lon],17,{animate:true});openDetail(p);});
    marker.addTo(S.map); S.markers.push(marker);
  });
  window._od=id=>{const p=S.places.find(x=>String(x.id)===String(id));if(p)openDetail(p);};
}
function clearMarkers() {
  S.markers.forEach(m=>S.map.removeLayer(m)); S.markers=[];
  if(S.routeCtrl){S.map.removeControl(S.routeCtrl);S.routeCtrl=null;}
}

/* ══════════════ DETAIL ══════════════════ */
function openDetail(p) {
  S.place=p; addVisit(p);
  S.stats.views=(S.stats.views||0)+1; saveStats();
  S.desktop ? openDetailDesktop(p) : openDetailMobile(p);
  S.map.setView([p.lat,p.lon],16,{animate:true,duration:.8});
}

function openDetailDesktop(p) {
  const meta=CAT[p.category]||{emoji:'📍',label:p.category};
  const saved=S.saved.some(s=>s.id===p.id);
  document.getElementById('detail-emoji').textContent=meta.emoji;
  document.getElementById('detail-name').textContent=p.name;
  document.getElementById('detail-category-tag').textContent=`${meta.label} · ${getAddr(p.tags)}`;
  document.getElementById('detail-distance').textContent=fmtDist(p.dist);
  document.getElementById('detail-walk').textContent=walkETA(p.dist);
  document.getElementById('detail-drive').textContent=driveETA(p.dist);
  showOpenStatus(p.tags,'open-status-row','open-status-badge','open-status-hours');
  updateCompass(p);
  buildInfoRows(p.tags,p,'detail-info-list');
  updateSaveBtn('btn-save',saved);
  loadStars(p.id,'star');
  loadNote(p.id,'place-notes');
  document.getElementById('walkability-row').style.display='flex';
  const ws=walkScore(p); document.getElementById('walkability-bar').style.width=`${ws}%`; document.getElementById('walkability-val').textContent=`${ws}/100`;
  showBusy();
  const cb=document.getElementById('btn-call'),wb=document.getElementById('btn-whatsapp-place');
  if(p.tags.phone){cb.style.display='flex';cb.onclick=()=>window.location=`tel:${p.tags.phone}`;wb.style.display='flex';wb.onclick=()=>window.open(`https://wa.me/${p.tags.phone.replace(/\D/g,'')}?text=Hi!`,'_blank');}
  else{cb.style.display='none';wb.style.display='none';}
  document.querySelectorAll('#detail-panel .transport-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===S.transport));
  document.getElementById('directions-panel').style.display='none';
  fetchWiki(p.name,'wiki-text','wiki-link','wiki-card');
  fetchPhoto(p.name,'place-photo','place-photo-wrap');
  if(S.voiceNav) speak(`${p.name}, ${fmtDist(p.dist)} away.`);
  const panel=document.getElementById('detail-panel');
  panel.style.display='flex'; requestAnimationFrame(()=>panel.classList.add('open'));
}
function closeDetailDesktop() {
  const panel=document.getElementById('detail-panel');
  panel.classList.remove('open'); setTimeout(()=>panel.style.display='none',350);
  if(S.routeCtrl){S.map.removeControl(S.routeCtrl);S.routeCtrl=null;}
  const dp=document.getElementById('directions-panel'); if(dp) dp.style.display='none';
  document.getElementById('compass-row').style.display='none';
  if(S.voiceSpeaking) window.speechSynthesis.cancel();
}
function showOpenStatus(tags,rowId,badgeId,hoursId){
  const status=getOpenStatus(tags);
  const row=document.getElementById(rowId);
  if(!status||!row){if(row)row.style.display='none';return;}
  row.style.display='flex';
  const b=document.getElementById(badgeId);
  if(b){b.textContent=status.open===true?'● Open Now':status.open===false?'● Closed':'⏰ Hours';b.className='open-status-badge '+(status.open===true?'open':'closed');}
  const h=document.getElementById(hoursId); if(h) h.textContent=status.hours||'';
}

function openDetailMobile(p) {
  const meta=CAT[p.category]||{emoji:'📍',label:p.category};
  const saved=S.saved.some(s=>s.id===p.id);
  document.getElementById('mob-detail-emoji').textContent=meta.emoji;
  document.getElementById('mob-detail-name').textContent=p.name;
  document.getElementById('mob-detail-cat').textContent=`${meta.label} · ${getAddr(p.tags)}`;
  document.getElementById('mob-distance').textContent=fmtDist(p.dist);
  document.getElementById('mob-walk').textContent=walkETA(p.dist);
  document.getElementById('mob-drive').textContent=driveETA(p.dist);
  showOpenStatus(p.tags,'mob-open-status','mob-open-badge','mob-open-hours');
  buildInfoRows(p.tags,p,'mob-info-list');
  updateSaveBtn('mob-btn-save',saved);
  loadStars(p.id,'mob-star');
  loadNote(p.id,'mob-notes');
  const cb=document.getElementById('mob-btn-call'),wb=document.getElementById('mob-btn-wa');
  if(p.tags.phone){cb.style.display='flex';cb.onclick=()=>window.location=`tel:${p.tags.phone}`;wb.style.display='flex';wb.onclick=()=>window.open(`https://wa.me/${p.tags.phone.replace(/\D/g,'')}?text=Hi!`,'_blank');}
  else{cb.style.display='none';wb.style.display='none';}
  document.querySelectorAll('#mobile-detail-drawer .transport-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===S.transport));
  document.getElementById('mob-directions-panel').style.display='none';
  fetchWiki(p.name,'mob-wiki-text','mob-wiki-link','mob-wiki-card');
  fetchPhoto(p.name,'mob-place-photo','mob-place-photo-wrap');
  if(S.voiceNav) speak(`${p.name}, ${fmtDist(p.dist)} away.`);
  document.getElementById('detail-overlay').style.display='block';
  const drawer=document.getElementById('mobile-detail-drawer');
  drawer.style.display='block'; requestAnimationFrame(()=>drawer.classList.add('open'));
}
function closeMobileDrawer() {
  const drawer=document.getElementById('mobile-detail-drawer'),ov=document.getElementById('detail-overlay');
  drawer.classList.remove('open');
  setTimeout(()=>{drawer.style.display='none';ov.style.display='none';},400);
  if(S.routeCtrl){S.map.removeControl(S.routeCtrl);S.routeCtrl=null;}
  document.getElementById('mob-directions-panel').style.display='none';
  if(S.voiceSpeaking) window.speechSynthesis.cancel();
}

/* ─── Info Rows ─────────────────────────── */
function buildInfoRows(tags,p,id){
  const list=document.getElementById(id); list.innerHTML='';
  const rows=[
    {icon:'📍',label:'Address',value:getFullAddr(tags)||getAddr(tags)||'No address'},
    tags.phone&&{icon:'📞',label:'Phone',value:`<a href="tel:${tags.phone}" style="color:var(--brand)">${tags.phone}</a>`},
    tags.website&&{icon:'🌐',label:'Website',value:`<a href="${escH(tags.website)}" target="_blank" rel="noopener" style="color:var(--brand)">${escH(tags.website.replace(/https?:\/\//,'').split('/')[0])}</a>`},
    tags.opening_hours&&{icon:'🕐',label:'Hours',value:escH(tags.opening_hours)},
    tags.wheelchair&&{icon:'♿',label:'Wheelchair',value:tags.wheelchair==='yes'?'✅ Accessible':'❌ Not accessible'},
    tags.cuisine&&{icon:'🍴',label:'Cuisine',value:escH(tags.cuisine)},
    {icon:'🌐',label:'Coordinates',value:`${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`},
  ].filter(Boolean);
  rows.forEach(row=>{
    const div=document.createElement('div'); div.className='info-row';
    div.innerHTML=`<span style="font-size:.9rem;flex-shrink:0;margin-top:1px">${row.icon}</span><div class="info-row-content"><div class="info-row-label">${row.label}</div><div class="info-row-value">${row.value}</div></div>`;
    list.appendChild(div);
  });
}

/* ─── Walkability / Busy ─────────────────── */
function walkScore(p){return Math.min(100,Math.max(0,100-Math.round((p.dist/S.radius)*60))+Math.min(40,S.places.length*2));}
function showBusy(){
  const row=document.getElementById('busy-row'),barsEl=document.getElementById('busy-bars'),nowEl=document.getElementById('busy-now');
  if(!row) return;
  const h=new Date().getHours(); barsEl.innerHTML='';
  BUSYNESS.forEach((v,hh)=>{
    const bar=document.createElement('div'); bar.className='busy-bar-item'+(hh===h?' current':'');
    bar.style.cssText=`height:${Math.round(v*36/100)}px;background:${hh===h?'#fbbf24':v>70?'#fb923c':v>40?'#4ade80':'rgba(255,255,255,.15)'};border-radius:3px 3px 0 0`;
    barsEl.appendChild(bar);
  });
  const lv=BUSYNESS[h];
  nowEl.textContent=`Now (${h}:00): ${lv>=80?'🔴 Very Busy':lv>=60?'🟠 Busy':lv>=40?'🟡 Moderate':'🟢 Quiet'}`;
  row.style.display='block';
}

/* ─── Open Status ───────────────────────── */
function getOpenStatus(tags){
  const oh=tags.opening_hours; if(!oh) return null;
  if(oh.toLowerCase().includes('24/7')) return{open:true,label:'Open 24/7',hours:'Always open'};
  const now=new Date(),h=now.getHours(),dm=['su','mo','tu','we','th','fr','sa'],today=dm[now.getDay()];
  const lower=oh.toLowerCase();
  if(lower.includes(today)||lower.includes('mo-fr')||lower.includes('mo-su')){
    const m=oh.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if(m){const open=parseInt(m[1])*60+parseInt(m[2]),close=parseInt(m[3])*60+parseInt(m[4]),cur=h*60+now.getMinutes();const isOpen=cur>=open&&cur<close;return{open:isOpen,label:isOpen?'Open Now':'Closed',hours:oh};}
  }
  return{open:null,label:'See Hours',hours:oh};
}

/* ─── Photo / Wikipedia ─────────────────── */
async function fetchPhoto(name,imgId,wrapId){
  const img=document.getElementById(imgId),wrap=document.getElementById(wrapId);
  if(!img||!wrap||!name||name==='Unknown'){if(wrap)wrap.style.display='none';return;}
  wrap.style.display='none';
  try{const slug=encodeURIComponent(name.replace(/ /g,'_'));const data=await (await fetch(`${WIKI}${slug}`,{headers:{Accept:'application/json'}})).json();if(data.thumbnail?.source){img.src=data.thumbnail.source;img.onload=()=>wrap.style.display='block';img.onerror=()=>wrap.style.display='none';}}catch{}
}
async function fetchWiki(name,textId,linkId,cardId){
  const card=document.getElementById(cardId); if(card) card.style.display='none';
  if(!name||name==='Unknown') return;
  try{const slug=encodeURIComponent(name.replace(/ /g,'_'));const data=await (await fetch(`${WIKI}${slug}`,{headers:{Accept:'application/json'}})).json();if(data.type==='disambiguation'||!data.extract)return;const tEl=document.getElementById(textId),lEl=document.getElementById(linkId);if(tEl)tEl.textContent=data.extract.slice(0,280)+(data.extract.length>280?'…':'');if(lEl)lEl.href=data.content_urls?.desktop?.page||`https://en.wikipedia.org/wiki/${slug}`;if(card)card.style.display='block';}catch{}
}

/* ─── Star Ratings ──────────────────────── */
function loadStars(id,prefix){
  const r=S.ratings[id]||0;
  document.querySelectorAll(`.${prefix}`).forEach(s=>s.classList.toggle('active',parseInt(s.dataset.v)<=r));
  const lbl=document.getElementById(prefix==='mob-star'?'mob-rating-label':'rating-label');
  if(lbl) lbl.textContent=r?`${r}/5 ★`:'Rate this place';
}
function setRating(id,val,prefix){
  S.ratings[id]=val; localStorage.setItem('nm_rates',JSON.stringify(S.ratings));
  loadStars(id,prefix); toast(`⭐ Rated ${val} star${val>1?'s':''}!`); renderPlaces(S.filtered);
}

/* ─── Notes ─────────────────────────────── */
function loadNote(id,elId){const el=document.getElementById(elId);if(el) el.value=S.notes[id]||'';}
function saveNote(id,text){
  if(text.trim())S.notes[id]=text.trim(); else delete S.notes[id];
  localStorage.setItem('nm_notes',JSON.stringify(S.notes)); toast(text.trim()?'📝 Note saved!':'📝 Note cleared');
}

/* ─── Visit History ─────────────────────── */
function addVisit(p){
  const entry={id:p.id,name:p.name,category:p.category,lat:p.lat,lon:p.lon,tags:p.tags,dist:p.dist,time:Date.now()};
  S.visits=[entry,...S.visits.filter(h=>h.id!==p.id)].slice(0,20);
  localStorage.setItem('nm_visits',JSON.stringify(S.visits));
}

/* ─── Trip Planner ──────────────────────── */
function addToTrip(p){
  if(S.tripStops.find(s=>s.id===p.id)){toast('Already in trip!');return;}
  if(S.tripStops.length>=8){toast('⚠️ Max 8 stops');return;}
  S.tripStops.push({id:p.id,name:p.name,lat:p.lat,lon:p.lon,tags:p.tags,dist:p.dist,category:p.category});
  toast(`✅ ${p.name} added to trip!`);
}
function renderTrip(stopsId,emptyId,actionsId,summaryId){
  const stopsEl=document.getElementById(stopsId),emptyEl=document.getElementById(emptyId),actionsEl=document.getElementById(actionsId),summaryEl=document.getElementById(summaryId);
  stopsEl.innerHTML='';
  if(!S.tripStops.length){if(emptyEl)emptyEl.style.display='block';if(actionsEl)actionsEl.style.display='none';return;}
  if(emptyEl)emptyEl.style.display='none';if(actionsEl)actionsEl.style.display='flex';
  let total=S.lat&&S.tripStops.length?haversine(S.lat,S.lon,S.tripStops[0].lat,S.tripStops[0].lon):0;
  for(let i=1;i<S.tripStops.length;i++) total+=haversine(S.tripStops[i-1].lat,S.tripStops[i-1].lon,S.tripStops[i].lat,S.tripStops[i].lon);
  S.tripStops.forEach((stop,i)=>{
    if(i>0){const con=document.createElement('div');con.className='trip-connector';con.innerHTML=`<div class="trip-connector-line"></div><span>${fmtDist(haversine(S.tripStops[i-1].lat,S.tripStops[i-1].lon,stop.lat,stop.lon))}</span><div class="trip-connector-line"></div>`;stopsEl.appendChild(con);}
    const meta=CAT[stop.category]||{emoji:'📍'};
    const card=document.createElement('div');card.className='trip-stop-card';
    card.innerHTML=`<div class="trip-stop-num">${i+1}</div><div class="trip-stop-info"><div class="trip-stop-name">${meta.emoji} ${escH(stop.name)}</div><div class="trip-stop-dist">${fmtDist(stop.dist)} from you</div></div><button class="trip-stop-remove">✕</button>`;
    card.querySelector('.trip-stop-remove').addEventListener('click',()=>{S.tripStops.splice(i,1);renderBothTrip();});
    stopsEl.appendChild(card);
  });
  if(summaryEl) summaryEl.innerHTML=`<strong>${S.tripStops.length} stops</strong> · ~${fmtDist(total)} total · ~${Math.round(total/400)} min drive`;
}
function renderBothTrip(){
  renderTrip('trip-stops','trip-empty','trip-actions','trip-summary');
  renderTrip('mob-trip-stops','mob-trip-empty','mob-trip-actions','mob-trip-summary');
}
function copyTripText(){
  if(!S.tripStops.length){toast('No stops to copy');return;}
  const lines=['🗺️ My Trip Plan (NearMe)',''];
  S.tripStops.forEach((s,i)=>lines.push(`${i+1}. ${s.name} — ${fmtDist(s.dist)}`));
  lines.push('','📍 Generated by NearMe');
  navigator.clipboard.writeText(lines.join('\n')).then(()=>toast('📋 Trip copied!')).catch(()=>toast('Copy failed'));
}
async function startTrip(){
  if(!S.lat){toast('📍 Location required');return;}
  if(!S.tripStops.length){toast('Add stops first!');return;}
  if(S.tripRouteCtrl){S.map.removeControl(S.tripRouteCtrl);S.tripRouteCtrl=null;}
  const waypoints=[L.latLng(S.lat,S.lon),...S.tripStops.map(s=>L.latLng(s.lat,s.lon))];
  S.tripRouteCtrl=L.Routing.control({waypoints,routeWhileDragging:false,addWaypoints:false,draggableWaypoints:false,fitSelectedRoutes:true,show:false,createMarker:()=>null,lineOptions:{styles:[{color:'#ff6584',opacity:.85,weight:5}]}}).addTo(S.map);
  closeAllPanels(); toast('🚀 Trip route loaded!');
  setTimeout(()=>S.map.invalidateSize(),300);
}

/* ─── Directions ────────────────────────── */
async function getDirections(p,panelId,stepsId){
  if(!S.lat){toast('📍 Location required');return;}
  const dBtn=document.getElementById(S.desktop?'btn-directions':'mob-btn-directions');
  if(dBtn){dBtn.textContent='⏳…';dBtn.disabled=true;}
  if(S.routeCtrl){S.map.removeControl(S.routeCtrl);S.routeCtrl=null;}
  try {
    S.routeCtrl=L.Routing.control({
      waypoints:[L.latLng(S.lat,S.lon),L.latLng(p.lat,p.lon)],
      routeWhileDragging:false,addWaypoints:false,draggableWaypoints:false,fitSelectedRoutes:true,show:false,createMarker:()=>null,
      router:L.Routing.osrmv1({serviceUrl:'https://router.project-osrm.org/route/v1',profile:S.transport}),
      lineOptions:{styles:[{color:'#6c63ff',opacity:.85,weight:5}]},
    });
    S.routeCtrl.on('routesfound',e=>{
      const route=e.routes[0]; S.lastDirSteps=route.instructions||[]; S.lastDirSummary=route.summary;
      renderSteps(stepsId,S.lastDirSteps,S.lastDirSummary);
      document.getElementById(panelId).style.display='block';
      if(S.voiceNav) speakDir(S.lastDirSteps,S.lastDirSummary);
      resetDirBtn();
    });
    S.routeCtrl.on('routingerror',()=>{toast('⚠️ Routing failed');L.polyline([[S.lat,S.lon],[p.lat,p.lon]],{color:'#6c63ff',weight:3,dashArray:'8,6',opacity:.8}).addTo(S.map);resetDirBtn();});
    S.routeCtrl.addTo(S.map);
  } catch {toast('⚠️ Routing error');resetDirBtn();}
}
function resetDirBtn(){['btn-directions','mob-btn-directions'].forEach(id=>{const b=document.getElementById(id);if(!b)return;b.innerHTML='<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Directions';b.disabled=false;});}
function renderSteps(id,steps,summary){
  const c=document.getElementById(id); c.innerHTML='';
  if(summary){const info=document.createElement('div');info.style.cssText='background:var(--grad-soft);border:1px solid rgba(108,99,255,.2);border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:.82rem;display:flex;gap:16px;';info.innerHTML=`<div><span style="color:var(--muted);font-size:.7rem">Distance</span><br/><strong>${(summary.totalDistance/1000).toFixed(1)} km</strong></div><div><span style="color:var(--muted);font-size:.7rem">ETA</span><br/><strong>${Math.round(summary.totalTime/60)} min</strong></div>`;c.appendChild(info);}
  steps.forEach((s,i)=>{const d=document.createElement('div');d.className='direction-step';d.innerHTML=`<div class="step-num">${i+1}</div><div class="step-text">${escH(s.text||s.instruction||'Continue')}${s.distance?`<div class="step-dist">📏 ${Math.round(s.distance)}m</div>`:''}</div>`;c.appendChild(d);});
  if(!steps.length)c.innerHTML='<p style="color:var(--muted);font-size:.82rem;text-align:center;padding:16px 0">Head to destination on map</p>';
}

/* ─── Voice Nav ─────────────────────────── */
function speak(text){
  if(!('speechSynthesis'in window)) return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text); u.lang='en-IN'; u.rate=0.9;
  u.onstart=()=>{S.voiceSpeaking=true;document.querySelectorAll('.voice-toggle-btn').forEach(b=>b.classList.add('speaking'));};
  u.onend=()=>{S.voiceSpeaking=false;document.querySelectorAll('.voice-toggle-btn').forEach(b=>b.classList.remove('speaking'));};
  window.speechSynthesis.speak(u);
}
function speakDir(steps,summary){
  if(!S.voiceNav) return;
  const texts=[];
  if(summary) texts.push(`Route: ${(summary.totalDistance/1000).toFixed(1)} km, ${Math.round(summary.totalTime/60)} minutes.`);
  steps.slice(0,3).forEach((s,i)=>texts.push(`Step ${i+1}: ${s.text||'Continue'}.`));
  if(texts.length) speak(texts.join(' '));
}

/* ─── Compass ───────────────────────────── */
function updateCompass(p){
  if(!S.lat) return;
  const brng=bearing(S.lat,S.lon,p.lat,p.lon);
  document.getElementById('compass-arrow').style.transform=`rotate(${brng}deg)`;
  document.getElementById('compass-bearing').textContent=`${bearingLabel(brng)} (${Math.round(brng)}°)`;
  document.getElementById('compass-dist-inline').textContent=`· ${fmtDist(p.dist)}`;
  document.getElementById('compass-row').style.display='flex';
}

/* ─── Share ─────────────────────────────── */
function shareMyLocation(){
  if(!S.lat){toast('📍 Location not available');return;}
  const url=`https://www.openstreetmap.org/?mlat=${S.lat}&mlon=${S.lon}&zoom=15`;
  if(navigator.share) navigator.share({title:'My Location',text:'📍 I am here!',url}).catch(()=>{});
  else navigator.clipboard.writeText(url).then(()=>toast('📋 Location link copied!')).catch(()=>toast('Copy failed'));
}
async function sharePlace(p){const url=`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}&zoom=17`;if(navigator.share)try{await navigator.share({title:p.name,text:`📍 ${p.name}`,url});return;}catch{}navigator.clipboard.writeText(`📍 ${p.name}\n${url}`).catch(()=>{});toast('📋 Link copied!');}
function copyAddr(p){navigator.clipboard.writeText(getFullAddr(p.tags)||getAddr(p.tags)).then(()=>toast('📋 Address copied!')).catch(()=>toast('Copy failed'));}
function copyCoords(p){navigator.clipboard.writeText(`${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}`).then(()=>toast('📋 Coords copied!')).catch(()=>toast('Copy failed'));}
function openGMaps(p){window.open(`https://www.google.com/maps/dir/?api=1&origin=${S.lat},${S.lon}&destination=${p.lat},${p.lon}`,'_blank');}
function openStreetView(p){window.open(`https://www.google.com/maps?q=${p.lat},${p.lon}&layer=c&cbll=${p.lat},${p.lon}`,'_blank');}
function toggleFS(){if(!document.fullscreenElement){document.documentElement.requestFullscreen?.();document.getElementById('fs-expand').style.display='none';document.getElementById('fs-collapse').style.display='block';}else{document.exitFullscreen?.();document.getElementById('fs-expand').style.display='block';document.getElementById('fs-collapse').style.display='none';}}

/* ─── QR ────────────────────────────────── */
function showQR(p){
  const url=`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}&zoom=17`;
  document.getElementById('qr-place-name').textContent=p.name;
  document.getElementById('qr-img').src=`${QR_API}${encodeURIComponent(url)}`;
  document.getElementById('qr-whatsapp').onclick=()=>{const msg=encodeURIComponent(`📍 ${p.name}\n${url}`);window.open(`https://wa.me/?text=${msg}`,'_blank');};
  document.getElementById('qr-modal').style.display='flex';
}

/* ─── Print Directions ──────────────────── */
function printDirections(p,steps,summary){
  const pw=window.open('','_blank');
  const dist=summary?`${(summary.totalDistance/1000).toFixed(1)} km`:'—';
  const eta=summary?`${Math.round(summary.totalTime/60)} min`:'—';
  const stepsHtml=steps.map((s,i)=>`<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;color:#6c63ff">${i+1}</td><td style="padding:8px;border-bottom:1px solid #eee">${escH(s.text||'Continue')}${s.distance?`<br/><small style="color:#999">${Math.round(s.distance)}m</small>`:''}</td></tr>`).join('');
  pw.document.write(`<!DOCTYPE html><html><head><title>Directions to ${escH(p.name)}</title><style>body{font-family:Inter,sans-serif;padding:24px;max-width:600px;margin:0 auto}h1{color:#6c63ff}table{width:100%;border-collapse:collapse}.info{background:#f0f0ff;border-radius:8px;padding:12px;margin:12px 0;display:flex;gap:24px}</style></head><body><h1>📍 ${escH(p.name)}</h1><h2>${escH(getAddr(p.tags))}</h2><div class="info"><div><small>Distance</small><br/><strong>${dist}</strong></div><div><small>ETA</small><br/><strong>${eta}</strong></div></div><table><thead><tr><th style="padding:8px;text-align:left;border-bottom:2px solid #6c63ff">#</th><th style="padding:8px;text-align:left;border-bottom:2px solid #6c63ff">Instruction</th></tr></thead><tbody>${stepsHtml||'<tr><td colspan="2" style="padding:12px">Head to destination</td></tr>'}</tbody></table><p style="color:#999;font-size:.8rem;margin-top:24px">Generated by NearMe · ${new Date().toLocaleString()}</p></body></html>`);
  pw.document.close(); setTimeout(()=>pw.print(),500);
}

/* ─── Save/Export ───────────────────────── */
function toggleSave(p){
  const idx=S.saved.findIndex(s=>s.id===p.id);
  if(idx>=0){S.saved.splice(idx,1);toast('💔 Removed from saved');}
  else{S.saved.push({id:p.id,name:p.name,category:p.category,lat:p.lat,lon:p.lon,tags:p.tags,dist:p.dist});toast('❤️ Place saved!');}
  localStorage.setItem('nm_saved',JSON.stringify(S.saved));
  const isSaved=S.saved.some(s=>s.id===p.id);
  updateSaveBtn('btn-save',isSaved); updateSaveBtn('mob-btn-save',isSaved);
  updateSavedBadge(); renderPlaces(S.filtered);
}
function updateSaveBtn(id,saved){const btn=document.getElementById(id);if(!btn)return;btn.innerHTML=saved?'❤️ Saved':'❤️ Save';btn.className=saved?'action-btn secondary saved':'action-btn secondary';}
function updateSavedBadge(){
  const c=S.saved.length;
  ['mob-saved-badge'].forEach(id=>{const b=document.getElementById(id);if(b){b.textContent=c;b.style.display=c?'flex':'none';}});
  const sb=document.getElementById('snav-badge-saved'); if(sb){sb.textContent=c;sb.style.display=c?'flex':'none';}
}
function renderSaved(listId,emptyId){
  const list=document.getElementById(listId),empty=document.getElementById(emptyId); list.innerHTML='';
  if(!S.saved.length){if(empty)empty.style.display='block';list.style.display='none';return;}
  if(empty)empty.style.display='none'; list.style.display='flex';
  S.saved.forEach((p,i)=>{
    const meta=CAT[p.category]||{emoji:'📍'};
    const card=document.createElement('div');card.className='place-card';card.style.animationDelay=`${i*30}ms`;
    card.innerHTML=`<div class="place-icon">${meta.emoji}</div><div class="place-info"><div class="place-name">${escH(p.name)}</div><div class="place-addr">${escH(getAddr(p.tags))}</div><div class="place-meta"><span class="place-dist">${fmtDist(p.dist||0)}</span><span class="place-open open">❤️</span></div></div><svg class="place-arrow" viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    card.addEventListener('click',()=>{closeAllPanels();S.map.setView([p.lat,p.lon],16,{animate:true});openDetail(p);});
    list.appendChild(card);
  });
}
function exportSaved(){const blob=new Blob([JSON.stringify(S.saved,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='nearme_saved.json';a.click();URL.revokeObjectURL(url);toast('📤 Exported!');}

/* ─── Stats ─────────────────────────────── */
function renderStats(bodyId){
  const body=document.getElementById(bodyId); body.innerHTML='';
  const topCat=Object.entries(S.stats.cats||{}).sort((a,b)=>b[1]-a[1])[0];
  const topMeta=topCat?CAT[topCat[0]]:null;
  body.innerHTML=`<div class="stat-row-card"><div class="stat-row-title">Places Explored</div><div class="stat-big">${S.stats.views||0}</div><div class="stat-sub">total place views</div></div><div class="stats-grid"><div class="stat-mini-card"><div class="stat-mini-emoji">🔍</div><div class="stat-mini-val">${S.stats.searches||0}</div><div class="stat-mini-label">Searches</div></div><div class="stat-mini-card"><div class="stat-mini-emoji">❤️</div><div class="stat-mini-val">${S.saved.length}</div><div class="stat-mini-label">Saved</div></div><div class="stat-mini-card"><div class="stat-mini-emoji">⭐</div><div class="stat-mini-val">${Object.keys(S.ratings).length}</div><div class="stat-mini-label">Ratings</div></div><div class="stat-mini-card"><div class="stat-mini-emoji">${topMeta?.emoji||'📍'}</div><div class="stat-mini-val" style="font-size:.82rem">${topMeta?.label||'—'}</div><div class="stat-mini-label">Top Category</div></div></div><div class="stat-row-card"><div class="stat-row-title">👨‍👩‍👧 Family Contacts</div><div class="stat-big">${S.contacts.length}</div></div><div class="stat-row-card"><div class="stat-row-title">Recently Visited</div><div id="${bodyId}-hist" class="history-list"></div></div>`;
  const hl=body.querySelector(`#${bodyId}-hist`);
  S.visits.slice(0,8).forEach((item,i)=>{
    const meta=CAT[item.category]||{emoji:'📍'};
    const div=document.createElement('div');div.className='history-item';div.style.animationDelay=`${i*40}ms`;
    div.innerHTML=`<div class="history-item-emoji">${meta.emoji}</div><div class="history-item-info"><div class="history-item-name">${escH(item.name)}</div><div class="history-item-time">${timeAgo(item.time)}</div></div>`;
    div.addEventListener('click',()=>{closeAllPanels();S.map.setView([item.lat,item.lon],16,{animate:true});openDetail(item);});
    hl.appendChild(div);
  });
}
function timeAgo(ts){const d=Date.now()-ts,min=Math.floor(d/60000);if(min<1)return'Just now';if(min<60)return`${min}m ago`;const h=Math.floor(min/60);if(h<24)return`${h}h ago`;return`${Math.floor(h/24)}d ago`;}
function saveStats(){localStorage.setItem('nm_stats',JSON.stringify(S.stats));}

/* ─── Emergency Contacts ─────────────────── */
function renderContacts(){
  const list=document.getElementById('contacts-list'),empty=document.getElementById('contacts-empty'),shareAll=document.getElementById('sos-share-all');
  list.innerHTML='';
  if(!S.contacts.length){empty.style.display='block';shareAll.style.display='none';return;}
  empty.style.display='none';shareAll.style.display='flex';
  S.contacts.forEach((c,i)=>{
    const card=document.createElement('div');card.className='contact-card';
    card.innerHTML=`<div class="contact-avatar">${c.name.charAt(0).toUpperCase()}</div><div class="contact-info"><div class="contact-name">${escH(c.name)}</div><div class="contact-phone">${escH(c.phone)}</div></div><div class="contact-actions"><a href="tel:${c.phone}" class="contact-call-btn">📞</a><button class="contact-wa-btn" data-i="${i}">💬</button><button class="contact-del-btn" data-d="${i}">✕</button></div>`;
    card.querySelector('.contact-wa-btn').addEventListener('click',()=>sendSOS(c));
    card.querySelector('.contact-del-btn').addEventListener('click',()=>{S.contacts.splice(i,1);localStorage.setItem('nm_contacts',JSON.stringify(S.contacts));renderContacts();toast('🗑️ Removed');});
    list.appendChild(card);
  });
}
function saveContact(){
  const name=document.getElementById('contact-name').value.trim(),phone=document.getElementById('contact-phone').value.trim().replace(/\s/g,'');
  if(!name){toast('⚠️ Enter name');return;}
  if(!phone||!/^[+\d]{7,15}$/.test(phone)){toast('⚠️ Enter valid phone');return;}
  S.contacts.push({name,phone}); localStorage.setItem('nm_contacts',JSON.stringify(S.contacts));
  document.getElementById('contact-name').value=''; document.getElementById('contact-phone').value='';
  document.getElementById('add-contact-form').style.display='none';
  renderContacts(); toast(`✅ ${name} added!`);
}
function sendSOS(c){
  if(!S.lat){toast('📍 Location not available');return;}
  const loc=`https://maps.google.com/?q=${S.lat},${S.lon}`;
  const msg=encodeURIComponent(`🆘 EMERGENCY! I need help!\n📍 My location: ${loc}\n\nPlease call me. Sent via NearMe`);
  const phone=c.phone.replace(/^\+/,'').replace(/\D/g,'');
  window.open(`https://wa.me/${phone}?text=${msg}`,'_blank');
  toast(`💬 SOS sent to ${c.name}`);
}
function sendSOSAll(){
  if(!S.contacts.length){toast('⚠️ No contacts added');return;}
  if(!S.lat){toast('📍 Location required');return;}
  S.contacts.forEach(c=>sendSOS(c));
  toast(`🚨 SOS sent to ${S.contacts.length} contact(s)!`);
}

/* ─── History ───────────────────────────── */
function renderHistory(){
  const c=document.getElementById('search-history'); if(!c) return;
  if(!S.history.length){c.style.display='none';return;}
  c.style.display='block';
  c.innerHTML=`<div class="search-history-title">Recent</div><div class="history-chips">${S.history.map((h,i)=>`<div class="history-chip" data-idx="${i}"><svg viewBox="0 0 24 24" fill="none" width="12" height="12"><circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>${escH(h)}<span style="color:var(--muted);cursor:pointer;padding-left:4px" data-del="${i}">✕</span></div>`).join('')}</div>`;
  c.querySelectorAll('.history-chip').forEach(chip=>{
    chip.addEventListener('click',e=>{
      if(e.target.dataset.del!==undefined){S.history.splice(parseInt(e.target.dataset.del),1);localStorage.setItem('nm_hist',JSON.stringify(S.history));renderHistory();return;}
      const q=chip.textContent.trim().replace('✕','').trim();
      ['search-input','header-search-input'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=q;});
      filterBySearch(q); c.style.display='none';
    });
  });
}

/* ─── Panel Helpers ─────────────────────── */
function showLoading(v){document.getElementById('places-loading').style.display=v?'flex':'none';document.getElementById('places-list').style.display=v?'none':'flex';}
function showEmpty(v){document.getElementById('places-empty').style.display=v?'flex':'none';if(v)document.getElementById('places-list').innerHTML='';}
function showRetryBtn(){
  const existing=document.getElementById('retry-places-btn'); if(existing) return;
  const emptyEl=document.getElementById('places-empty');
  const btn=document.createElement('button'); btn.id='retry-places-btn';
  btn.style.cssText='margin-top:14px;background:var(--grad);color:#fff;border-radius:var(--r4);padding:10px 28px;font-size:.84rem;font-weight:700;cursor:pointer;border:none;';
  btn.textContent='🔄 Retry'; btn.addEventListener('click',()=>{btn.remove();loadPlaces();}); emptyEl.appendChild(btn);
}
function closeAllPanels(){
  if(S.desktop){
    const poi=document.getElementById('panel-overlay-inner'); if(poi) poi.style.display='none';
    document.querySelectorAll('.panel-content').forEach(p=>p.style.display='none');
    document.querySelectorAll('.snav-item').forEach(n=>n.classList.remove('active'));
    document.getElementById('snav-explore').classList.add('active');
  } else {
    ['mobile-trip-panel','mobile-saved-panel','mobile-more-panel','mobile-stats-panel'].forEach(id=>{
      const p=document.getElementById(id); if(p&&p.style.display!=='none'){p.classList.add('hide');setTimeout(()=>{p.style.display='none';p.classList.remove('hide');},350);}
    });
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    document.getElementById('nav-explore').classList.add('active');
  }
}
function openDesktopPanel(contentId){
  const poi=document.getElementById('panel-overlay-inner');
  document.querySelectorAll('.panel-content').forEach(p=>p.style.display='none');
  const t=document.getElementById(contentId); if(t) t.style.display='flex';
  poi.style.display='flex';
}
function openMobilePanel(id){const p=document.getElementById(id);if(p)p.style.display='flex';}
function syncSettingsUI(){
  const s=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v;};
  const c=(id,v)=>{const el=document.getElementById(id);if(el)el.checked=v;};
  s('map-style-select',S.mapStyle); s('default-radius-select',String(S.radius)); s('default-transport-select',S.transport); s('mob-map-style',S.mapStyle);
  c('radius-circle-toggle',S.showCircle); c('dark-mode-toggle',S.theme==='dark'); c('auto-night-toggle',S.autoNight);
  c('voice-nav-toggle',S.voiceNav); c('proximity-toggle',S.proximity);
  c('mob-dark-mode',S.theme==='dark'); c('mob-voice-nav',S.voiceNav); c('mob-proximity',S.proximity);
  const sl=document.getElementById('radius-slider'); if(sl) sl.value=S.radius;
  const dv=document.getElementById('radius-display-val'); if(dv) dv.textContent=fmtDist(S.radius);
  document.querySelectorAll('.radius-pill').forEach(p=>p.classList.toggle('active',parseInt(p.dataset.radius)===S.radius));
}
function updateFilterDot(){const d=document.getElementById('filter-dot');if(d)d.style.display=(S.filterOpen||S.filterWheelchair)?'block':'none';}

/* ─── Toast ─────────────────────────────── */
let toastTimer;
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.style.display='none',3200);}
function escH(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* ─── Math ──────────────────────────────── */
function haversine(la1,lo1,la2,lo2){const R=6371000,f1=la1*Math.PI/180,f2=la2*Math.PI/180,df=(la2-la1)*Math.PI/180,dl=(lo2-lo1)*Math.PI/180,a=Math.sin(df/2)**2+Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
function fmtDist(m){return m<1000?`${Math.round(m)}m`:`${(m/1000).toFixed(1)}km`;}
function walkETA(m){const min=Math.round(m/80);return min<1?'<1 min':`${min} min`;}
function driveETA(m){const min=Math.round(m/500);return min<1?'<1 min':`${min} min`;}
function bearing(la1,lo1,la2,lo2){const f1=la1*Math.PI/180,f2=la2*Math.PI/180,dl=(lo2-lo1)*Math.PI/180,y=Math.sin(dl)*Math.cos(f2),x=Math.cos(f1)*Math.sin(f2)-Math.sin(f1)*Math.cos(f2)*Math.cos(dl);return(Math.atan2(y,x)*180/Math.PI+360)%360;}
function bearingLabel(d){return['N','NE','E','SE','S','SW','W','NW'][Math.round(d/45)%8];}

/* ══════════════ EVENTS ══════════════════ */
function initEvents() {

  /* Header */
  document.getElementById('theme-toggle').addEventListener('click',()=>applyTheme(S.theme==='dark'?'light':'dark'));
  document.getElementById('refresh-btn').addEventListener('click',()=>{toast('🔄 Refreshing…');requestLocation();});
  document.getElementById('share-location-btn').addEventListener('click',shareMyLocation);
  document.getElementById('weather-chip').addEventListener('click',showWeatherModal);
  document.getElementById('close-weather').addEventListener('click',()=>document.getElementById('weather-modal').style.display='none');
  document.getElementById('weather-modal').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.style.display='none';});

  /* Sidebar toggle (desktop) */
  document.getElementById('sidebar-toggle').addEventListener('click',()=>{
    if(!S.desktop) return;
    const sb=document.getElementById('sidebar');
    S.sidebarCollapsed=!sb.classList.contains('collapsed');
    sb.classList.toggle('collapsed');
    localStorage.setItem('nm_sidebar',S.sidebarCollapsed);
    setTimeout(()=>S.map.invalidateSize(),350);
  });

  /* Desktop header search */
  let debH;
  const hsi=document.getElementById('header-search-input');
  hsi.addEventListener('input',e=>{
    const q=e.target.value;
    document.getElementById('search-input').value=q;
    document.getElementById('clear-search').style.display=q?'block':'none';
    clearTimeout(debH); debH=setTimeout(()=>{filterBySearch(q);if(q.length>=2)showAutocomplete(q);},300);
  });
  hsi.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();filterBySearch(hsi.value);if(hsi.value.trim().length>=2)searchGlobal(hsi.value.trim());}if(e.key==='Escape')hideAutocomplete();});
  hsi.addEventListener('blur',()=>setTimeout(hideAutocomplete,200));

  /* Map controls */
  document.getElementById('recenter-btn').addEventListener('click',()=>{if(S.lat){S.map.setView([S.lat,S.lon],15,{animate:true});toast('📍 Centered');}});
  document.getElementById('track-btn').addEventListener('click',()=>S.tracking?stopTracking():startTracking());
  document.getElementById('measure-btn').addEventListener('click',()=>S.measureMode?exitMeasure():enterMeasure());
  document.getElementById('measure-cancel').addEventListener('click',exitMeasure);
  document.getElementById('fullscreen-btn').addEventListener('click',toggleFS);
  document.getElementById('panic-btn').addEventListener('click',()=>{
    toast('🚑 Finding nearest hospital…');
    S.category='hospital'; S.query='["amenity"="hospital"]';
    const bigR=Math.max(S.radius,5000); S.radius=bigR;
    document.querySelectorAll('.cat-chip').forEach(c=>c.classList.remove('active'));
    document.querySelector('.cat-chip[data-category="hospital"]')?.classList.add('active');
    const sl=document.getElementById('radius-slider');if(sl)sl.value=bigR;
    const dv=document.getElementById('radius-display-val');if(dv)dv.textContent=fmtDist(bigR);
    updateCircle(); loadPlaces();
    renderContacts(); document.getElementById('sos-modal').style.display='flex';
  });

  /* Filter */
  document.getElementById('filter-toggle-btn').addEventListener('click',()=>{
    S.filterOpen2=!S.filterOpen2;
    document.getElementById('filter-panel').style.display=S.filterOpen2?'flex':'none';
  });
  /* Radius slider */
  const sl=document.getElementById('radius-slider'), dv=document.getElementById('radius-display-val');
  sl.addEventListener('input',()=>{dv.textContent=fmtDist(parseInt(sl.value));document.querySelectorAll('.radius-pill').forEach(p=>p.classList.toggle('active',parseInt(p.dataset.radius)===parseInt(sl.value)));});
  let slDeb; sl.addEventListener('change',()=>{clearTimeout(slDeb);slDeb=setTimeout(()=>{S.radius=parseInt(sl.value);localStorage.setItem('nm_radius',S.radius);updateCircle();loadPlaces();toast(`📏 Radius: ${fmtDist(S.radius)}`);},300);});
  document.querySelectorAll('.radius-pill').forEach(p=>p.addEventListener('click',()=>{
    document.querySelectorAll('.radius-pill').forEach(x=>x.classList.remove('active'));p.classList.add('active');
    S.radius=parseInt(p.dataset.radius);localStorage.setItem('nm_radius',S.radius);
    sl.value=S.radius; dv.textContent=fmtDist(S.radius); updateCircle();loadPlaces();toast(`📏 Radius: ${fmtDist(S.radius)}`);
  }));
  document.querySelectorAll('.sort-pill').forEach(p=>p.addEventListener('click',()=>{
    document.querySelectorAll('.sort-pill').forEach(x=>x.classList.remove('active'));p.classList.add('active'); S.sort=p.dataset.sort;
    if(S.sort==='name') S.filtered.sort((a,b)=>a.name.localeCompare(b.name));
    else if(S.sort==='rating') S.filtered.sort((a,b)=>(S.ratings[b.id]||0)-(S.ratings[a.id]||0));
    else S.filtered.sort((a,b)=>a.dist-b.dist);
    renderPlaces(S.filtered);
  }));
  document.getElementById('filter-open').addEventListener('change',e=>{S.filterOpen=e.target.checked;updateFilterDot();loadPlaces();});
  document.getElementById('filter-wheelchair').addEventListener('change',e=>{S.filterWheelchair=e.target.checked;updateFilterDot();loadPlaces();});
  document.getElementById('filter-radius-circle').addEventListener('change',e=>{S.showCircle=e.target.checked;localStorage.setItem('nm_circle',e.target.checked);updateCircle();});

  /* Categories */
  document.querySelectorAll('.cat-chip').forEach(chip=>chip.addEventListener('click',()=>{
    document.querySelectorAll('.cat-chip').forEach(c=>c.classList.remove('active'));chip.classList.add('active');
    S.category=chip.dataset.category; S.query=chip.dataset.query;
    ['search-input','header-search-input'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    document.getElementById('clear-search').style.display='none'; hideAutocomplete();
    loadPlaces();
  }));

  /* Mobile search */
  const si=document.getElementById('search-input'), cb=document.getElementById('clear-search');
  let deb;
  si.addEventListener('focus',renderHistory);
  si.addEventListener('input',()=>{
    const q=si.value;
    document.getElementById('header-search-input').value=q;
    cb.style.display=q?'block':'none';
    document.getElementById('search-history').style.display=q?'none':(S.history.length?'block':'none');
    if(q.length>=2) showAutocomplete(q);
    clearTimeout(deb); deb=setTimeout(()=>filterBySearch(q),300);
  });
  si.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();filterBySearch(si.value);if(si.value.trim().length>=2)searchGlobal(si.value.trim());hideAutocomplete();}if(e.key==='Escape')hideAutocomplete();});
  si.addEventListener('blur',()=>setTimeout(()=>{hideAutocomplete();document.getElementById('search-history').style.display='none';},200));
  cb.addEventListener('click',()=>{si.value='';document.getElementById('header-search-input').value='';cb.style.display='none';filterBySearch('');hideAutocomplete();si.focus();renderHistory();});

  /* Desktop detail */
  document.getElementById('close-detail').addEventListener('click',closeDetailDesktop);
  document.getElementById('btn-directions').addEventListener('click',()=>S.place&&getDirections(S.place,'directions-panel','directions-steps'));
  document.getElementById('btn-save').addEventListener('click',()=>S.place&&toggleSave(S.place));
  document.getElementById('btn-share').addEventListener('click',()=>S.place&&sharePlace(S.place));
  document.getElementById('btn-copy-addr').addEventListener('click',()=>S.place&&copyAddr(S.place));
  document.getElementById('btn-copy-coords').addEventListener('click',()=>S.place&&copyCoords(S.place));
  document.getElementById('btn-open-gmaps').addEventListener('click',()=>S.place&&openGMaps(S.place));
  document.getElementById('btn-streetview').addEventListener('click',()=>S.place&&openStreetView(S.place));
  document.getElementById('btn-qr').addEventListener('click',()=>S.place&&showQR(S.place));
  document.getElementById('btn-trip-add').addEventListener('click',()=>S.place&&addToTrip(S.place));
  document.getElementById('btn-voice-nav').addEventListener('click',()=>S.place&&speak(`${S.place.name}, ${fmtDist(S.place.dist)} away.`));
  document.getElementById('btn-print-dir').addEventListener('click',()=>S.place&&printDirections(S.place,S.lastDirSteps,S.lastDirSummary));
  document.getElementById('notes-save').addEventListener('click',()=>S.place&&saveNote(S.place.id,document.getElementById('place-notes').value));
  document.getElementById('voice-toggle-btn').addEventListener('click',()=>{if(S.voiceSpeaking)window.speechSynthesis.cancel();else if(S.place)speak(`${S.place.name}.`);});
  document.querySelectorAll('#detail-panel .transport-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('#detail-panel .transport-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');S.transport=btn.dataset.mode;localStorage.setItem('nm_transport',S.transport);toast(`Transport: ${btn.textContent.trim()}`);;}));
  document.querySelectorAll('.star').forEach(star=>{
    star.addEventListener('click',()=>{if(S.place)setRating(S.place.id,parseInt(star.dataset.v),'star');});
    star.addEventListener('mouseover',()=>{const v=parseInt(star.dataset.v);document.querySelectorAll('.star').forEach(s=>s.classList.toggle('active',parseInt(s.dataset.v)<=v));});
    star.addEventListener('mouseout',()=>{if(S.place)loadStars(S.place.id,'star');});
  });

  /* Mobile drawer */
  document.getElementById('detail-overlay').addEventListener('click',closeMobileDrawer);
  document.getElementById('mob-close-detail').addEventListener('click',closeMobileDrawer);
  const drawer=document.getElementById('mobile-detail-drawer');
  let sy=0;
  drawer.addEventListener('touchstart',e=>{sy=e.touches[0].clientY;},{passive:true});
  drawer.addEventListener('touchend',e=>{if(e.changedTouches[0].clientY-sy>80)closeMobileDrawer();},{passive:true});
  document.getElementById('mob-btn-directions').addEventListener('click',()=>S.place&&getDirections(S.place,'mob-directions-panel','mob-direction-steps'));
  document.getElementById('mob-btn-save').addEventListener('click',()=>S.place&&toggleSave(S.place));
  document.getElementById('mob-btn-share').addEventListener('click',()=>S.place&&sharePlace(S.place));
  document.getElementById('mob-btn-addr').addEventListener('click',()=>S.place&&copyAddr(S.place));
  document.getElementById('mob-btn-gmaps').addEventListener('click',()=>S.place&&openGMaps(S.place));
  document.getElementById('mob-btn-coords').addEventListener('click',()=>S.place&&copyCoords(S.place));
  document.getElementById('mob-btn-sv').addEventListener('click',()=>S.place&&openStreetView(S.place));
  document.getElementById('mob-btn-qr').addEventListener('click',()=>S.place&&showQR(S.place));
  document.getElementById('mob-btn-trip').addEventListener('click',()=>S.place&&addToTrip(S.place));
  document.getElementById('mob-btn-voice').addEventListener('click',()=>S.place&&speak(`${S.place.name}, ${fmtDist(S.place.dist)} away.`));
  document.getElementById('mob-btn-print').addEventListener('click',()=>S.place&&printDirections(S.place,S.lastDirSteps,S.lastDirSummary));
  document.getElementById('mob-notes-save').addEventListener('click',()=>S.place&&saveNote(S.place.id,document.getElementById('mob-notes').value));
  document.getElementById('mob-voice-toggle').addEventListener('click',()=>{if(S.voiceSpeaking)window.speechSynthesis.cancel();else if(S.place)speak(`${S.place.name}.`);});
  document.querySelectorAll('#mobile-detail-drawer .transport-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('#mobile-detail-drawer .transport-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');S.transport=btn.dataset.mode;localStorage.setItem('nm_transport',S.transport);}));
  document.querySelectorAll('.mob-star').forEach(star=>{
    star.addEventListener('click',()=>{if(S.place)setRating(S.place.id,parseInt(star.dataset.v),'mob-star');});
    star.addEventListener('mouseover',()=>{const v=parseInt(star.dataset.v);document.querySelectorAll('.mob-star').forEach(s=>s.classList.toggle('active',parseInt(s.dataset.v)<=v));});
    star.addEventListener('mouseout',()=>{if(S.place)loadStars(S.place.id,'mob-star');});
  });

  /* Desktop sidebar nav */
  document.getElementById('snav-explore').addEventListener('click',()=>{closeAllPanels();document.getElementById('snav-explore').classList.add('active');});
  document.getElementById('snav-trip').addEventListener('click',()=>{document.querySelectorAll('.snav-item').forEach(n=>n.classList.remove('active'));document.getElementById('snav-trip').classList.add('active');renderBothTrip();openDesktopPanel('trip-content');});
  document.getElementById('snav-saved').addEventListener('click',()=>{document.querySelectorAll('.snav-item').forEach(n=>n.classList.remove('active'));document.getElementById('snav-saved').classList.add('active');renderSaved('saved-list','saved-empty');openDesktopPanel('saved-content');});
  document.getElementById('snav-stats').addEventListener('click',()=>{document.querySelectorAll('.snav-item').forEach(n=>n.classList.remove('active'));document.getElementById('snav-stats').classList.add('active');renderStats('stats-body');openDesktopPanel('stats-content');});
  document.getElementById('snav-settings').addEventListener('click',()=>{document.querySelectorAll('.snav-item').forEach(n=>n.classList.remove('active'));document.getElementById('snav-settings').classList.add('active');openDesktopPanel('settings-content');});
  document.getElementById('snav-track').addEventListener('click',()=>S.tracking?stopTracking():startTracking());
  document.getElementById('sidebar-sos').addEventListener('click',()=>{renderContacts();document.getElementById('sos-modal').style.display='flex';});
  document.querySelectorAll('.close-panel-content').forEach(btn=>btn.addEventListener('click',()=>{document.getElementById('panel-overlay-inner').style.display='none';document.querySelectorAll('.snav-item').forEach(n=>n.classList.remove('active'));document.getElementById('snav-explore').classList.add('active');}));
  document.getElementById('export-saved').addEventListener('click',exportSaved);
  document.getElementById('clear-saved').addEventListener('click',()=>{S.saved=[];localStorage.setItem('nm_saved','[]');updateSavedBadge();renderSaved('saved-list','saved-empty');toast('🗑️ Cleared');});
  document.getElementById('btn-start-trip').addEventListener('click',startTrip);
  document.getElementById('btn-copy-trip').addEventListener('click',copyTripText);
  document.getElementById('btn-clear-trip').addEventListener('click',()=>{S.tripStops=[];renderBothTrip();toast('🗑️ Trip cleared');});

  /* Mobile bottom nav */
  document.getElementById('nav-explore').addEventListener('click',()=>closeAllPanels());
  document.getElementById('nav-map').addEventListener('click',()=>{closeAllPanels();document.getElementById('nav-map').classList.add('active');S.map.setView([S.lat||20.59,S.lon||78.96],S.map.getZoom());setTimeout(()=>S.map.invalidateSize(),300);});
  document.getElementById('nav-trip').addEventListener('click',()=>{closeAllPanels();document.getElementById('nav-trip').classList.add('active');renderBothTrip();openMobilePanel('mobile-trip-panel');});
  document.getElementById('nav-favourites').addEventListener('click',()=>{closeAllPanels();document.getElementById('nav-favourites').classList.add('active');renderSaved('mob-saved-list','mob-saved-empty');openMobilePanel('mobile-saved-panel');});
  document.getElementById('nav-more').addEventListener('click',()=>{closeAllPanels();document.getElementById('nav-more').classList.add('active');openMobilePanel('mobile-more-panel');});
  document.getElementById('mob-stats-btn').addEventListener('click',()=>{document.getElementById('mobile-more-panel').style.display='none';renderStats('mob-stats-body');openMobilePanel('mobile-stats-panel');});
  document.getElementById('mob-settings-btn').addEventListener('click',()=>{document.getElementById('mobile-more-panel').style.display='none';openMobilePanel('mobile-more-panel');});
  document.getElementById('mob-sos-btn-more').addEventListener('click',()=>{document.getElementById('mobile-more-panel').style.display='none';renderContacts();document.getElementById('sos-modal').style.display='flex';});
  document.getElementById('mob-weather-btn').addEventListener('click',()=>{document.getElementById('mobile-more-panel').style.display='none';showWeatherModal();});
  document.getElementById('mob-track-btn').addEventListener('click',()=>{document.getElementById('mobile-more-panel').style.display='none';S.tracking?stopTracking():startTracking();});
  document.getElementById('mob-share-loc').addEventListener('click',()=>{document.getElementById('mobile-more-panel').style.display='none';shareMyLocation();});
  document.querySelectorAll('.close-mobile-panel').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.panel;const p=document.getElementById(id);p.classList.add('hide');setTimeout(()=>{p.style.display='none';p.classList.remove('hide');},350);document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));document.getElementById('nav-explore').classList.add('active');}));
  document.getElementById('mob-btn-start-trip').addEventListener('click',startTrip);
  document.getElementById('mob-btn-copy-trip').addEventListener('click',copyTripText);
  document.getElementById('mob-btn-clear-trip').addEventListener('click',()=>{S.tripStops=[];renderBothTrip();toast('🗑️ Trip cleared');});
  document.getElementById('mob-export-saved').addEventListener('click',exportSaved);
  document.getElementById('mob-clear-saved').addEventListener('click',()=>{S.saved=[];localStorage.setItem('nm_saved','[]');updateSavedBadge();renderSaved('mob-saved-list','mob-saved-empty');toast('🗑️ Cleared');});

  /* SOS FAB */
  document.getElementById('sos-fab').addEventListener('click',()=>{renderContacts();document.getElementById('sos-modal').style.display='flex';});
  document.getElementById('close-sos').addEventListener('click',()=>document.getElementById('sos-modal').style.display='none');
  document.getElementById('sos-modal').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.style.display='none';});
  document.getElementById('add-contact-toggle').addEventListener('click',()=>{const f=document.getElementById('add-contact-form');f.style.display=f.style.display==='none'?'block':'none';document.getElementById('contact-name').focus();});
  document.getElementById('save-contact-btn').addEventListener('click',saveContact);
  document.getElementById('cancel-contact-btn').addEventListener('click',()=>document.getElementById('add-contact-form').style.display='none');
  document.getElementById('contact-phone').addEventListener('keydown',e=>{if(e.key==='Enter')saveContact();});
  document.getElementById('sos-share-all').addEventListener('click',sendSOSAll);

  /* QR */
  document.getElementById('close-qr').addEventListener('click',()=>document.getElementById('qr-modal').style.display='none');
  document.getElementById('qr-modal').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.style.display='none';});

  /* Settings */
  document.getElementById('dark-mode-toggle').addEventListener('change',e=>applyTheme(e.target.checked?'dark':'light'));
  document.getElementById('auto-night-toggle').addEventListener('change',e=>{S.autoNight=e.target.checked;localStorage.setItem('nm_autoNight',e.target.checked);if(e.target.checked)applyAutoNight();});
  document.getElementById('radius-circle-toggle').addEventListener('change',e=>{S.showCircle=e.target.checked;localStorage.setItem('nm_circle',e.target.checked);updateCircle();});
  document.getElementById('map-style-select').addEventListener('change',e=>{updateTile(e.target.value);toast('🗺️ Map style updated');});
  document.getElementById('default-radius-select').addEventListener('change',e=>{S.radius=parseInt(e.target.value);localStorage.setItem('nm_radius',S.radius);sl.value=S.radius;dv.textContent=fmtDist(S.radius);updateCircle();loadPlaces();});
  document.getElementById('default-transport-select').addEventListener('change',e=>{S.transport=e.target.value;localStorage.setItem('nm_transport',S.transport);});
  document.getElementById('voice-nav-toggle').addEventListener('change',e=>{S.voiceNav=e.target.checked;localStorage.setItem('nm_voiceNav',e.target.checked);toast(e.target.checked?'🔊 Voice ON':'🔇 Voice OFF');});
  document.getElementById('proximity-toggle').addEventListener('change',e=>{S.proximity=e.target.checked;localStorage.setItem('nm_proximity',e.target.checked);});
  document.getElementById('clear-history-btn').addEventListener('click',()=>{S.history=[];localStorage.removeItem('nm_hist');toast('🗑️ History cleared');});
  document.getElementById('reset-stats-btn').addEventListener('click',()=>{S.stats={views:0,cats:{},searches:0};saveStats();toast('📊 Stats reset');});
  document.getElementById('mob-dark-mode').addEventListener('change',e=>applyTheme(e.target.checked?'dark':'light'));
  document.getElementById('mob-voice-nav').addEventListener('change',e=>{S.voiceNav=e.target.checked;localStorage.setItem('nm_voiceNav',e.target.checked);});
  document.getElementById('mob-proximity').addEventListener('change',e=>{S.proximity=e.target.checked;localStorage.setItem('nm_proximity',e.target.checked);});
  document.getElementById('mob-map-style').addEventListener('change',e=>{updateTile(e.target.value);document.getElementById('map-style-select').value=e.target.value;toast('🗺️ Map updated');});
  document.getElementById('mob-clear-history').addEventListener('click',()=>{S.history=[];localStorage.removeItem('nm_hist');toast('🗑️ History cleared');});
}
