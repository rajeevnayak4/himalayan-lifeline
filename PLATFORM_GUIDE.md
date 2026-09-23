# 🏔️ Jiban Dan — Complete Platform User Guide
### Off-Grid Mountain Emergency SOS & Mesh Rescue Network (Nepal Himalayas)

Welcome to **Jiban Dan** (हिमालयन लाइफलाइन) — a crowd-sourced emergency distress and search-and-rescue network purpose-built for low-connectivity alpine regions in Nepal (Khumbu Valley / Everest & Annapurna trails).

---

## 📌 Table of Contents
1. [Overview & Alpine Context](#1-overview--alpine-context)
2. [Quickstart & Accessing the Platform](#2-quickstart--accessing-the-platform)
3. [User Persona 1: The Trekker / Climber (`/sos`)](#3-user-persona-1-the-trekker--climbernpx prisma db seed

5. [User Persona 3: Rescue Coordination HQ (`/dashboard`)](#5-user-persona-3-rescue-coordination-hq-dashboard)
6. [Hackathon Demo Center (`/demo`)](#6-hackathon-demo-center-demo)
7. [Offline-First & Mesh Relay Mechanics](#7-offline-first--mesh-relay-mechanics)
8. [Low-Literacy & Audio TTS Capabilities](#8-low-literacy--audio-tts-capabilities)
9. [Database Schema & API Reference](#9-database-schema--api-reference)
10. [Technical Honesty: Real vs. Simulated](#10-technical-honesty-real-vs-simulated)

---

## 1. Overview & Alpine Context

Above Namche Bazaar (3,440m) on the Everest Base Camp trail, standard cellular coverage (Nepal Telecom 4G / Ncell) becomes erratic or non-existent due to glacial topography, extreme cold, and lack of grid power.

When a solo trekker slips on rocky scree near Lobuche Pass (4,940m) or develops High Altitude Pulmonary Edema (HAPE), traditional emergency apps fail completely because they depend on continuous cloud connectivity.

**Jiban Dan solves this through a four-tier resilience architecture:**
1. **One-Tap Emergency Distress Beacon**: Captures GPS coordinates, elevation, low-literacy injury icons, and a 10-second compressed voice note.
2. **Offline IndexedDB Storage**: If no cellular signal is detected, the distress call is safely buffered in the browser's persistent database.
3. **Simulated BLE Mesh Multi-Hop Relay**: Distress packets bounce peer-to-peer across nearby trekkers' smartphones and autonomous solar repeater beacons until reaching a connected satellite gateway.
4. **Geo-Fenced Community Dispatch**: Responders (local Sherpa guides, lodge owners, and army rescue posts) within a 10–15km radius receive critical alerts with terrain-adjusted climbing ETAs and audio voice readouts in Nepali, Hindi, and English.

---

## 2. Quickstart & Accessing the Platform

### Running the Platform Locally
The application is pre-configured to run out of the box with zero external API key requirements:

```bash
# 1. Install dependencies
npm install

# 2. Synchronize database schema (PostgreSQL / SQLite compatible)
npx prisma db push

# 3. Seed Everest Base Camp trail demo scenario
npm run seed
# or: npx prisma db seed

# 4. Start development server
npm run dev
```

### Accessing the Web Application
Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 3. User Persona 1: The Trekker / Climber (`/sos`)

The Trekker interface is designed for high-stress, freezing conditions where motor skills are impaired and thick gloves are worn.

### How to Trigger an Emergency SOS:
1. Navigate to **[http://localhost:3000/sos](http://localhost:3000/sos)** or click **"SOS Beacon"** in the top navigation bar.
2. **Select Condition (Low-Literacy Grid)**:
   - 🦴 **Fall / Fracture**: Bone broken, cannot bear weight on rocky trails.
   - 🏔️ **Severe Altitude Sickness (HAPE/HACE)**: Severe breathlessness, coughing, cerebral confusion.
   - ❄️ **Hypothermia / Frostbite**: Freezing extremities, numbness.
   - ⚠️ **Lost / Avalanche**: Trapped off-trail or buried by snow slide.
   - 🚨 **General Medical Distress**: Bleeding, shock, cardiac distress.
3. **Record 10-Second Voice Note (Optional)**:
   - Tap **"Record Voice Note"** to speak your situation.
   - The audio is converted to an efficient base64 payload attached directly to the distress packet.
4. **Trigger Beacon**:
   - Tap the giant **"HOLD TO SEND SOS"** button.
   - A **5-second abort countdown** appears. If triggered accidentally, tap **"CANCEL FALSE ALARM"** to abort.
5. **Testing Off-Grid Mode**:
   - Check the **"Force Off-Grid Mesh Mode"** toggle at the top of the screen.
   - Transmitting now buffers the SOS directly into browser **IndexedDB** (`HimalayanLifelineDB`) and switches to the live BLE mesh propagation state.
6. **Live Responder Tracker**:
   - Once dispatched, the screen displays a live status board:
     - *"Searching registered responders within 10km radius..."*
     - Updates in real-time as local Sherpas acknowledge: *"Pasang Sherpa is en route, ETA ~25 min"*.

---

## 4. User Persona 2: Local Guides & Lodge Responders (`/alerts`)

Field responders (Sherpa guides, teahouse owners, high-altitude porters) need immediate proximity awareness and actionable navigation.

### How to Monitor and Respond to Emergencies:
1. Navigate to **[http://localhost:3000/alerts](http://localhost:3000/alerts)**.
2. **Filter by Radius**:
   - Use the **Radius filter** (5km, 10km, 15km, 25km) to view emergencies within your walking perimeter.
3. **Tactical Mountain Map**:
   - Interactive OpenStreetMap showing the victim's pulsing red distress marker relative to your location.
4. **Proximity & Tobler's Climbing ETA**:
   - The card calculates great-circle distance via the **Haversine formula**.
   - Applies **Tobler's Mountain Hiking Function**, penalizing ascent by **+15 minutes per 100 meters of vertical climb**.
5. **Audible Siren & Voice Readout**:
   - Incoming distress triggers an alternating **880Hz / 660Hz alpine siren** (Web Audio API).
   - Tap **"TTS"** or **"Listen Alert"** to have the victim's name, injury, and distance read aloud in **Nepali (नेपाली)**, **Hindi (हिन्दी)**, or **English**.
6. **Accepting Help**:
   - Click **"Respond"** on any alert card to open the incident dossier (`/alerts/[id]`).
   - Select your estimated arrival time (e.g., 15m, 30m, 45m, 1h).
   - Enter equipment notes: *"Bringing splint, thermal bivouac, and oxygen tank"*.
   - Tap **"I CAN HELP (I'M EN ROUTE)"**.
   - This immediately updates the victim's device and all other guides' screens to prevent redundant rescue efforts.

---

## 5. User Persona 3: Rescue Coordination HQ (`/dashboard`)

The Command Center view is built for the **Nepal Army Mountain Rescue Liaison** and the **Himalayan Rescue Association (HRA)** clinic.

### Features of the Command Center:
1. Navigate to **[http://localhost:3000/dashboard](http://localhost:3000/dashboard)**.
2. **Tactical Regional Map**:
   - High-level tactical overview of the entire Khumbu Valley corridor from Lukla (2,860m) to Everest Base Camp (5,364m).
   - Pins indicate active incidents, resolved rescues, and medical aid stations (Pheriche HRA Clinic).
3. **KPI Counters**:
   - **Active Incidents**: Real-time distress signals awaiting resolution.
   - **Safely Resolved**: Archived rescues.
   - **Off-Grid BLE Relayed**: Alerts transmitted via multi-hop mesh without cellular network.
   - **Helicopter Evac Readiness**: Monitors high-altitude flight visibility and cloud ceiling windows (>5,800m).
4. **Incident Manifest Table**:
   - Filter by status: `all`, `active`, `responding`, `resolved`.
   - View delivery protocol: direct 4G cloud vs. multi-hop mesh relay logs.
   - Direct link to open any incident dossier.

---

## 6. Hackathon Demo Center (`/demo`)

Built specifically for judges and evaluators to test all complex distributed systems in **under 2 minutes without needing multiple physical devices**:

1. Navigate to **[http://localhost:3000/demo](http://localhost:3000/demo)**.
2. **1-Click Seed Everest Scenario**:
   - Seeds 6 realistic mountain nodes (Pasang Sherpa, Mingma Lodge, Dr. Sonam at Pheriche Clinic, Captain Dawa at Namche Army HQ, and an active distress incident at Lobuche Pass, 4,940m).
3. **Run Animated Mesh Relay**:
   - Click **"Run Animated Mesh Relay"**.
   - Watch the blue packet hop step-by-step down the mountain terrain with an animated dashed SVG line connecting each node.
4. **Inspect Packet Telemetry**:
   - Click **"Inspect Packet Telemetry"** to view the BLE 5.2 packet inspector modal.
   - Shows: Packet ID, Time-To-Live (TTL countdown from 5), MTU byte size (244 bytes), RSSI signal strength in dBm, and hardware battery percentages.
5. **Test Audio & Speech Synthesis**:
   - Click **"🔊 Speak Nepali"** to hear: *"आपतकालीन उद्धार चाहिएको छ! लोबुचे पास नजिकै यात्री लडेर घाइते भएका छन्।"*
   - Click **"🚨 Play Siren"** to test the synthesized Web Audio emergency siren.

---

## 7. Offline-First & Mesh Relay Mechanics

### Native IndexedDB Queuing
- Implemented in [`lib/offline/sosQueue.ts`](file:///Users/coffin/Documents/hack/himalayan-life-line/lib/offline/sosQueue.ts).
- When a user triggers SOS with `navigator.onLine === false` (or with "Force Off-Grid" checked), the full payload (coordinates, voice recording, injury, timestamp) is stored in the browser's native IndexedDB (`HimalayanLifelineDB`).
- The application automatically registers event listeners for `window.addEventListener('online', ...)`.
- As soon as signal is detected, a background worker flushes the queued records to `/api/sos` and notifies the user.

### PWA Service Worker
- Registered in [`public/sw.js`](file:///Users/coffin/Documents/hack/himalayan-life-line/public/sw.js) and [`public/manifest.json`](file:///Users/coffin/Documents/hack/himalayan-life-line/public/manifest.json).
- Caches the core application shell, map icons, and fonts for full offline functionality.

---

## 8. Low-Literacy & Audio TTS Capabilities

High-altitude emergencies involve local porters, yak herders, and injured climbers who may be disoriented or have limited literacy:
- **Language Switcher**: Located in the top-right of the navbar, toggles between **EN** (English), **ने** (Nepali - नेपाली), and **हि** (Hindi - हिन्दी).
- **Giant Touch Targets**: Minimum 56px height, high-contrast borders for easy tapping with cold or gloved hands.
- **Pictorial Emergency Cards**: Visual icons for fractures, frostbite, edema, and avalanches.
- **Web Audio API Alpine Siren**: Synthesizes a loud 880Hz / 660Hz oscillating siren through `AudioContext` without requiring external audio files.
- **Web Speech API TTS**: Automatically selects native voice engines (`ne-NP`, `hi-IN`, `en-US`) to read critical alert summaries aloud.

---

## 9. Database Schema & API Reference

### Core Prisma Models ([`prisma/schema.prisma`](file:///Users/coffin/Documents/hack/himalayan-life-line/prisma/schema.prisma))
- **`User`**: Profiles (`trekker`, `guide`, `lodge_owner`, `villager`, `rescue_coordinator`), phone, emergency contact, last known GPS coordinates, altitude, battery.
- **`SOSAlert`**: Distress incident tracking victim ID, coordinates, altitude, location name, injury type, audio note base64, status (`active`, `responding`, `resolved`), offline queued flag, hop count.
- **`Response`**: Responder action board tracking who is responding, status (`acknowledged`, `en_route`, `arrived`), and estimated arrival time in minutes.
- **`RelayLog`**: Multi-hop BLE packet trail recording node ID, name, elevation, RSSI signal strength (dBm), coordinates, and hop timestamp.
- **`Checkin`**: Passive 15-minute breadcrumb trail tracking trekker movement and battery level for search-and-rescue last-known-position queries.

### API Endpoints

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/sos` | `POST` | Triggers SOS, calculates geo-fenced responders within radius, broadcasts realtime event. |
| `/api/sos` | `GET` | Lists active alerts with optional `lat`, `lng`, and `radius` proximity filtering. |
| `/api/sos/[id]` | `GET` | Retrieves full incident dossier, victim details, voice recording, and responder list. |
| `/api/sos/[id]` | `PATCH` | Updates alert status (`active`, `responding`, `resolved`, `false_alarm`). |
| `/api/sos/[id]/respond` | `POST` | Records responder acknowledgment, updates ETA, and notifies peer responders. |
| `/api/geofence` | `POST` | Computes users within radius using Haversine formula and returns PostGIS SQL equivalent. |
| `/api/realtime` | `GET` | Server-Sent Events (SSE) live broadcast stream for zero-config multi-device updates. |
| `/api/relay-simulate` | `POST` | Simulates step-by-step mesh relay hop and broadcasts hop progress. |
| `/api/seed` | `POST` | Re-seeds pristine Everest Base Camp trail scenario with 6 nodes and 1 active distress call. |

---

## 10. Technical Honesty: Real vs. Simulated

Judges respect engineering integrity. Here is the exact technical breakdown:

### 100% Real Production Code
- **Offline SOS Persistence**: Native browser IndexedDB (`HimalayanLifelineDB`) with automatic background sync.
- **Geo-Fencing Calculation**: Spherical Haversine formula + Tobler's alpine hiking function (+15 min per 100m elevation gain).
- **Database Layer**: Production PostgreSQL database on Neon via Prisma ORM.
- **Realtime Sync**: Server-Sent Events (SSE) route streaming live broadcasts to all open browser windows.
- **Audio Alarm & TTS**: Web Audio API dual-tone siren oscillator + Web Speech API multi-lingual speech synthesizer.
- **Progressive Web App**: Offline Service Worker caching application shell.

### Simulated for Hackathon Demo
- **Bluetooth Mesh Hardware Advertising**: Standard web browsers strictly forbid background BLE Peripheral Advertising (GAP Broadcaster mode) to protect user device security. In a commercial deployment, our architecture deploys into a **React Native native app wrapper** (`react-native-ble-advertiser`) or bridges to autonomous **solar-powered LoRa/BLE Meshtastic repeaters** installed on Himalayan mountain passes.

---

*Jiban Dan — Built for the mountaineers, guides, and search-and-rescue teams of Nepal.*
