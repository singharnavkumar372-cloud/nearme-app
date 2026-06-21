# 📍 NearMe — Discover What's Around You

<div align="center">

![NearMe Banner](https://img.shields.io/badge/NearMe-v4.0-6c63ff?style=for-the-badge&logo=mapbox&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile%20PWA-ff6584?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-fbbf24?style=for-the-badge&logo=github)

**A powerful, beautiful, mobile-first web app to discover hospitals, restaurants, ATMs, parks and 22+ place categories near you — with real-time directions, SOS emergency alerts, trip planner, admin panel, and live user tracking.**

[🌐 Live App](https://singharnavkumar372-cloud.github.io/nearme-app) • [🔐 Admin Panel](https://singharnavkumar372-cloud.github.io/nearme-app/admin.html) • [📁 GitHub Repo](https://github.com/singharnavkumar372-cloud/nearme-app)

</div>

---

## 🚀 Live Demo

| | URL |
|---|---|
| 📱 **Main App** | https://singharnavkumar372-cloud.github.io/nearme-app |
| 🔐 **Admin Panel** | https://singharnavkumar372-cloud.github.io/nearme-app/admin.html |
| 🔑 **Admin Password** | `admin123` |

---

## ✨ Features

### 🗺️ Map & Search
- **Real-time location** — GPS-powered, shows your exact position
- **22 categories** — Hospitals, Restaurants, ATMs, Pharmacies, Cafes, Fuel, Parks, Police, Hotels, Gyms, Cinemas, Libraries, Bus Stops, Restrooms, and more
- **Global search** — Type any place name, powered by Nominatim + OpenStreetMap
- **Autocomplete dropdown** — Smart suggestions as you type
- **Voice search** 🎤 — Speak to search hands-free
- **Custom radius slider** — Set search radius from 100m to 20km
- **4 map styles** — Dark, Light, Satellite, Topo

### 🧭 Navigation & Directions
- **Turn-by-turn directions** — Walking, Driving, Cycling routes via OSRM
- **Voice navigation** 🔊 — Spoken step-by-step instructions
- **Print directions** — Opens a print-friendly directions page
- **Google Maps integration** — Open any place in Google Maps
- **Street View** — Google Street View for any place
- **Distance measure tool** — Click 2 points on the map to measure distance
- **Compass bearing** — Shows direction to selected place

### 🏥 Emergency & Safety
- **🚑 Panic Button** — Instantly finds the nearest hospital
- **SOS Alert** — Send WhatsApp emergency messages with your live location
- **Family contacts** — Add family members, blast SOS to all at once
- **Emergency numbers** — 112, 100, 108, 101, 1091, 1098

### 🗓️ Trip Planner
- **Multi-stop trips** — Add up to 8 stops
- **Route on map** — Full trip route shown on map
- **Copy trip** — Share your trip plan as text
- **Trip summary** — Total distance and estimated time

### 📊 Smart Features
- **Weather forecast** 🌤️ — 7-day weather using Open-Meteo API
- **Wikipedia info** — Auto-fetches info about selected places
- **Place photos** — Wikipedia thumbnail photos
- **Busy hours chart** — Estimated crowd levels by hour
- **Walkability score** — 0–100 score for each place
- **Open/Closed status** — Based on OpenStreetMap opening hours
- **Smart suggestions** — Time-based chips (Breakfast, Lunch, Dinner, etc.)

### ❤️ Personal
- **Save places** — Bookmark favourite places
- **5-star ratings** — Rate any place
- **Personal notes** — Add private notes to any place
- **Visit history** — Auto-tracks places you've viewed
- **Search history** — Quick access to recent searches
- **QR code sharing** — Share any place as a QR code
- **Export saved places** — Download as JSON

### 📱 Mobile & PWA
- **Fully responsive** — Works on any screen size
- **Mobile drawer** — Bottom sheet UI on phones
- **Desktop sidebar** — Full panel UI on desktop
- **PWA installable** — Add to home screen like a native app
- **Offline support** — Service Worker caches the app
- **Live GPS tracking** — Tracks your movement in real time
- **Speed display** — Shows your current speed while tracking

### 🔐 Admin Panel
- **Password-protected** dashboard
- **Live map** — See all user locations in real time 🟢
- **User table** — City, Device, OS, Browser, Visit count, Last active
- **Analytics charts** — Device, OS, Browser, Timezone breakdowns
- **Activity log** — Chronological visitor history
- **CSV/JSON export** — Download all user data
- **Firebase support** — Connect for global real-time tracking
- **Change password** — Secure admin credentials

---

## 📸 Screenshots

> Open the [Live App](https://singharnavkumar372-cloud.github.io/nearme-app) to see it in action!

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Maps** | Leaflet.js + OpenStreetMap |
| **Routing** | Leaflet Routing Machine + OSRM |
| **Places API** | OpenStreetMap Overpass API |
| **Search** | Nominatim Geocoding API |
| **Weather** | Open-Meteo API (free, no key needed) |
| **Info** | Wikipedia REST API |
| **Backend** | Python HTTP Server (tracking API) |
| **Hosting** | GitHub Pages (static) |
| **Tunnel** | Cloudflare Tunnel (live sharing) |
| **Tracking** | localStorage + optional Firebase |
| **PWA** | Service Worker + Web Manifest |

---

## 🚀 Run Locally

### Option 1 — Static (no tracking)
```bash
# Clone the repo
git clone https://github.com/singharnavkumar372-cloud/nearme-app.git
cd nearme-app

# Serve with Python
python -m http.server 3000

# Open
http://localhost:3000
```

### Option 2 — Full (with user tracking API)
```bash
# Start the Python backend
python server.py

# Open
http://localhost:3000        ← Main App
http://localhost:3000/admin.html  ← Admin Panel
```

### Share with Anyone (Cloudflare Tunnel)
```bash
# Download cloudflared and run
.\cloudflared.exe tunnel --url http://localhost:3000
# → Get a public URL like: https://xyz.trycloudflare.com
```

---

## 📦 Deploy to GitHub Pages

```bash
python deploy_github.py YOUR_GITHUB_TOKEN YOUR_USERNAME
```

Get your token at: https://github.com/settings/tokens/new (check `repo` scope)

---

## 📦 Deploy to Netlify

```bash
python deploy_netlify.py YOUR_NETLIFY_TOKEN
```

Get your token at: https://app.netlify.com/user/applications

---

## 🔐 Admin Panel Setup

1. Open `/admin.html`
2. Login with password: `admin123`
3. Change password in **Settings** tab
4. (Optional) Connect Firebase for real-time global tracking:
   - Create free project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Realtime Database in Test mode
   - Paste the database URL in Admin → Settings → Firebase

---

## 📁 Project Structure

```
nearme-app/
├── index.html          # Main app UI (responsive)
├── app.js              # All app logic (search, map, directions, etc.)
├── style.css           # All styles (glassmorphism, dark/light themes)
├── tracker.js          # User session tracking module
├── admin.html          # Admin dashboard (standalone)
├── server.py           # Python backend (tracking API)
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker (offline support)
├── deploy_github.py    # GitHub Pages deploy script
├── deploy_netlify.py   # Netlify deploy script
└── data/
    └── users.json      # Tracked user sessions (local storage)
```

---

## 🌐 API Endpoints (when running server.py)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/track` | Submit user location + device info |
| `GET` | `/api/users` | Get all tracked sessions |
| `GET` | `/api/stats` | Get summary statistics |
| `DELETE` | `/api/users` | Clear all tracked data |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `/` | Focus search bar |
| `Esc` | Close panels / hide autocomplete |
| `R` | Refresh / re-fetch location |
| `M` | Toggle distance measure tool |

---

## 🔒 Privacy

- Location is only used to find nearby places
- User tracking only happens after **explicit consent** (banner shown on first visit)
- No personal data is sold or shared
- All data stored locally or in your own Firebase database
- Users can decline tracking and still use all features

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 🙏 Credits

- [OpenStreetMap](https://www.openstreetmap.org) — Map data
- [Leaflet.js](https://leafletjs.com) — Interactive maps
- [Nominatim](https://nominatim.org) — Geocoding
- [OSRM](https://project-osrm.org) — Routing engine
- [Open-Meteo](https://open-meteo.com) — Weather data
- [Wikipedia API](https://en.wikipedia.org/api/) — Place information
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps) — Free HTTPS tunneling
- [CARTO](https://carto.com) — Dark map tiles

---

<div align="center">

Made with ❤️ by **singharnavkumar372-cloud**

⭐ **Star this repo if you found it useful!**

</div>
