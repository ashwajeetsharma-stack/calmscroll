# CalmScroll 🌿

> **Focus & Mindful Browsing Platform** — A calm, low-stimulation companion that shields your focus against digital distractions, provocative ragebait, and endless scrolling.

---

## 📁 Repository Structure

```
calmscroll/
├── extension/             # CalmScroll Chrome Extension (Manifest V3)
│   ├── manifest.json      # Extension configuration & permissions
│   ├── background.js      # Service worker (session timers, DNR rules, badge)
│   ├── popup/             # Extension toolbar popup interface
│   ├── content/           # Real-time Post-Shield feed scripts & CSS
│   ├── rules/             # DeclarativeNetRequest blocking rules
│   ├── shared/            # Procedural brown noise & theme system
│   ├── warning.html       # Deflection screen & study pass
│   ├── reset.html         # 2-minute box breathing reset
│   ├── payment.html       # Secure checkout flow
│   └── README.md          # Detailed extension documentation
├── .gitignore
└── README.md
```

---

## 🧩 Chrome Extension Overview

The extension protects your focus during work and study sessions:

1. **Toolbar Countdown Badge**: Live session timer (`25m`, `12m`, `1m`) and status indicators (`PASS`, `REST`, `🔒`) directly on the extension icon.
2. **Post-Shield Content Filter**: Detects outrage phrasing, clickbait headlines, and toxic rhetoric on major platforms (Reddit, X/Twitter, Instagram, YouTube, Threads, Facebook, TikTok), replacing them with peaceful mindful prompts.
3. **Custom Site Manager**: Custom domain blocking with category presets (Social, Video, News) and selective YouTube Shorts blocking.
4. **Pomodoro Cycles**: Automated 25m focus and 5m restorative break cycles with automatic block toggling.
5. **Procedural Brown Noise**: Client-side Web Audio ambient sound generation (100% offline, zero bandwidth).
6. **Box Breathing Reset**: 2-minute guided breathing reset (`Inhale 4s • Hold 4s • Exhale 4s • Rest 4s`).
7. **Warden Discipline & Study Pass**: Strict focus mode without bypasses, plus emergency 5-minute reference passes during normal focus.

### Installing the Extension

1. Open Chrome/Brave/Edge and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the upper-right corner.
3. Click **"Load unpacked"** and select the [`extension/`](extension/) directory from this repository.
4. Pin CalmScroll to your toolbar for instant access.

For detailed extension architecture, see [extension/README.md](extension/README.md).
