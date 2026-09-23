# 🏔️ Jiban Dan (हिमालयन लाइफलाइन)
### Off-Grid Mountain Emergency SOS & BLE Mesh Rescue Network for the Nepal Himalayas

> **Hackathon MVP Build**: Production-grade Next.js 16+ App Router, TypeScript, Tailwind CSS, Prisma (SQLite zero-setup / PostgreSQL PostGIS ready), Leaflet OpenStreetMap, IndexedDB Offline Queuing, Web Audio API Siren, Web Speech API TTS (Nepali/Hindi/English), and Simulated BLE Mesh Relay with real-time packet hop visualization.

---

## 🚀 Instant Zero-Config Judge Quickstart (NO API KEYS REQUIRED)

Judges and evaluators can clone and run this application immediately with **zero external API keys, zero cloud signups, and zero Docker dependencies**:

```bash
# 1. Install dependencies
npm install

# 2. Synchronize database (SQLite local file created automatically)
npx prisma generate
npx prisma db push

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧭 Hackathon Judge Testing Flow (Under 2 Minutes)

1. **Visit the Interactive Demo Center**: Navigate to [`/demo`](http://localhost:3000/demo).
2. **Click "1-Click Seed Everest Scenario"**: Pre-populates 6 realistic high-altitude nodes along the Khumbu Valley trail (Pasang Sherpa, Mingma Lodge, Dr. Sonam at Pheriche Clinic, Captain Dawa at Namche Army HQ, and an active distress incident at Lobuche Pass, 4,940m).
3. **Click "Run Animated Mesh Relay"**: Watch the simulated off-grid Bluetooth packet physically hop between mountain trail nodes down to the satellite gateway on the interactive Leaflet map!
4. **Test Low-Literacy TTS**: Click **"🔊 Speak Nepali"** or **"🚨 Play Siren"** to test the synthesized Web Audio emergency siren and native Nepali text-to-speech engine.
5. **Test One-Tap SOS**: Open [`/sos`](http://localhost:3000/sos). Check **"Force Off-Grid Mesh Mode"**, select an injury, record a 10s voice distress note, and tap **"SEND SOS"**. Observe immediate local IndexedDB persistence and peer relay transmission.
6. **Test Field Responder Coordination**: Open [`/alerts`](http://localhost:3000/alerts) to view active alerts sorted by proximity, or click **"Respond"** on an incident to see the live responder board update ("Pasang Sherpa is en route, ETA ~35 min").
7. **View Rescue HQ Command Center**: Navigate to [`/dashboard`](http://localhost:3000/dashboard) to view the tactical regional command board with active helicopter evacuation weather status.

---

## 🏗️ Architecture & Technical Honesty

Judges respect engineering integrity. Here is our exact breakdown of what is running live in the browser vs. what requires native hardware in the field:

| Feature | In-Browser MVP Status | Production Field Deployment |
| :--- | :--- | :--- |
| **SOS Offline Persistence** | **100% Real** (IndexedDB `himalayan_sos_offline_store`) | Same (IndexedDB / SQLite local mobile cache) |
| **Geo-Fencing & Mountain Distance** | **100% Real** (Haversine formula + Tobler's alpine hiking function) | Same + optional PostgreSQL PostGIS `ST_DWithin` |
| **Realtime Multi-Device Sync** | **100% Real** (Server-Sent Events `/api/realtime`) | SSE + Pusher / Supabase Realtime fallback |
| **Emergency Distress Siren** | **100% Real** (Web Audio API 880Hz/660Hz dual-frequency oscillator) | Native mobile high-decibel audio alert |
| **Low-Literacy Voice Readout** | **100% Real** (Web Speech API in Nepali `ne-NP`, Hindi `hi-IN`, English `en-US`) | Same Web Speech / native OS TTS |
| **PWA & Offline Shell** | **100% Real** (Service Worker `public/sw.js` + `manifest.json`) | Same PWA + native app store build |
| **BLE Mesh Packet Relaying** | **Simulated for Demo** (Visual hop engine + telemetry) | **Requires Native Mobile App / Hardware**: Standard web browsers strictly forbid background BLE Peripheral Advertising (GAP broadcaster) for user privacy. Production deployment uses a React Native wrapper (`react-native-ble-advertiser`) or solar-powered LoRa/BLE Meshtastic repeaters placed on high mountain passes. |

---

## 🗄️ Database Schema (Prisma)

- **`User`**: Role-based profiles (`trekker`, `guide`, `lodge_owner`, `villager`, `rescue_coordinator`), emergency contacts, registered trail route, last known GPS coordinates, altitude, and timestamps.
- **`SOSAlert`**: Distress incident tracking victim ID, coordinates, altitude, location name, injury type (`fall_fracture`, `altitude_sickness`, `hypothermia`, `lost_avalanche`, `other`), audio note base64, offline queued flag, and hop count.
- **`Response`**: Responder action board tracking who is responding, status (`acknowledged`, `en_route`, `arrived`), and estimated arrival time in minutes.
- **`RelayLog`**: Packet trail recording each hop node ID, node name, type, RSSI signal strength (dBm), coordinates, and hop timestamp.
- **`Checkin`**: Passive 15-minute breadcrumb trail tracking trekker movement and battery level for search-and-rescue last-known-position queries.

---

## 📐 Geo-Fencing & Altitude Gradient Calculation

Traditional flat-earth distance formulas fail in the Himalayas, where two points 2 km apart on a map may be separated by an unpassable 800-meter vertical ridge. Our geo-engine implements:

1. **Haversine Great-Circle Formula**:
   $$\Delta\sigma = 2 \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1\cos\phi_2\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
2. **Tobler's Mountain Hiking Function**:
   Adjusts walking ETA by adding **15 minutes per 100 meters of elevation gain** on rocky scree trails above 4,000m.
3. **PostGIS SQL Compatibility**:
   Provides drop-in compatibility for PostgreSQL deployments using `ST_DWithin` and `ST_Distance` on geography points.

---

## 🌐 Multi-Language (i18n) & Low-Literacy Design

Mountain accidents often happen in freezing conditions, blinding blizzards, or with local porters and yak drivers who may have limited literacy. Jiban Dan provides:
- Giant touch targets (56px+ height) usable with thick mountaineering gloves.
- Pictorial emergency condition cards (fractured bone, mountain altitude sickness, hypothermia, avalanche).
- Instant tri-lingual dictionary: English, Nepali (नेपाली), and Hindi (हिन्दी).
- 1-Tap **"🔊 Listen Alert"** button reading the victim's name, injury, and distance aloud in their native language.

---

Built with ❤️ for the mountaineers, Sherpas, and rescue teams of Nepal.
