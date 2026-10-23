# CalmScroll 🌿 — Focus & Mindful Browsing Companion

> **Version 0.2.0** — A calm, low-stimulation study companion that guards your focus against distractions, provocative ragebait, and endless scrolling.

---

## ✨ What's New in v0.2.0

CalmScroll has been substantially upgraded with powerful productivity, mindfulness, and digital wellbeing features:

1. **Live Toolbar Action Countdown Badge**
   - See remaining focus minutes (`25m`, `12m`, `1m`) or status badges (`PASS`, `REST`, `🔒`) directly on the extension icon without clicking.
   - Distinct color coding: Calm Sage Green for normal focus, Deep Navy for Warden Lock, Amber for Study Pass.

2. **Real-Time Post-Shield Content Script (`content/`)**
   - Active on Reddit, Twitter/X, Instagram, YouTube, Threads, Facebook, and TikTok.
   - Detects all-caps outrage phrasing, clickbait headlines, toxic rhetoric, and heated controversial topics (Politics, Violence, Celebrity Drama, Sports Feuds).
   - Softens high-stimulation posts behind a peaceful CalmScroll Shield with mindful pause prompts and voluntary "Show Post" reveal.

3. **Custom Site Manager & Category Presets**
   - Block **any custom domain** (e.g. `twitter.com`, `news.ycombinator.com`, `chess.com`).
   - One-click presets for **Social Media**, **Video/Streams**, and **News/Gossip**.
   - Preserves granular YouTube Shorts blocking while leaving educational YouTube videos accessible.

4. **Pomodoro Focus & Rest Cycles**
   - Toggle Pomodoro mode for automated 25-minute focus intervals followed by 5-minute restorative breaks.
   - Automatically lifts site blocks during break times and re-engages discipline when focus cycles resume.

5. **Built-in Procedural Brown Noise & Mindfulness Chimes**
   - Pure client-side Web Audio API procedural brown noise generator (airplane cabin / warm rain rumble) that masks distracting ambient sounds.
   - Resonant 528Hz Solfeggio Tibetan singing bowl chime upon session start and completion.
   - Zero audio file downloads, zero external bandwidth, 100% offline.

6. **2-Minute Guided Box Breathing Reset (`reset.html`)**
   - Synchronized visual breathing circle: **Inhale 4s • Hold 4s • Exhale 4s • Rest 4s**.
   - Procedural rain noise toggle and intentional next-action commitment.

7. **5-Minute Study / Reference Pass**
   - If you need a quick reference on a blocked site during Normal Focus, activate a 5-minute timed pass.
   - Strictly disabled in **Warden Mode** to protect non-negotiable discipline.

8. **Focus Statistics & Deflection Analytics**
   - Tracks Daily Focus Minutes, All-Time Focus, Completed Sessions, Distractions Deflected, Posts Shielded, and Daily Focus Streaks.

---

## Browser Support

| Browser | Supported? | Installation Notes |
|---|---|---|
| **Chrome 120+** | ✅ Yes | Load unpacked (instructions below) |
| **Brave** | ✅ Yes | Identical to Chrome — load unpacked |
| **Edge (Chromium)** | ✅ Yes | Load unpacked, same steps |
| **Safari** | ⚠️ Partial | Requires Xcode extension converter (macOS) |

---

## Installation (Chrome / Brave / Edge)

1. Open your browser and navigate to the extensions page:
   - Chrome / Edge: `chrome://extensions`
   - Brave: `brave://extensions`

2. Enable **Developer mode** (toggle in the top-right corner).

3. Click **"Load unpacked"** and select this `calmscroll/` folder.

4. CalmScroll will appear in your extensions list. Pin it to the toolbar for quick access.

> **To update after changes:** Return to `chrome://extensions` and click the ↺ reload icon on CalmScroll.

---

## Architecture & Files

| File / Folder | Purpose |
|---|---|
| `manifest.json` | Manifest V3 definition with declarativeNetRequest, content scripts, notifications, and alarms |
| `background.js` | Service worker — session timer, DNR blocking rules, badge ticker, stats tracking, classification engine |
| `content/content.js` | Post-shield content script scanning feeds for ragebait & toxic language |
| `content/content.css` | Calming design tokens & shield cards for feed posts |
| `popup/popup.html` | Tabbed extension popup (Focus, Sites, Shield, Sound, Stats) |
| `popup/popup.js` | UI controller for timers, custom blocklist, ambient player, and analytics |
| `shared/sound.js` | Web Audio procedural Brown Noise generator & Solfeggio Tibetan chime |
| `shared/theme.css` | Design tokens (calm palette, typography, radii, dark/light modes) |
| `warning.html` / `warning.js` | Focus shield page deflected attempts & 5-minute study pass |
| `reset.html` / `reset.js` | 2-Minute Guided Box Breathing reset with audio |
| `demo/feed.html` | Interactive test feed showcasing the shield classifier in action |

---

## Privacy & Offline First

- **No remote servers, no analytics, no tracking, no external requests.**
- All session data, stats, and blocklists reside strictly in your browser's `chrome.storage.local`.
- Ambient brown noise and chimes are synthesized procedurally via the browser's Web Audio API with zero external media files.
