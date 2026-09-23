<div align="center">

  <br />
  <img src="https://raw.githubusercontent.com/faithpoovathingal/iskoni-releases/main/assets/logo.png" alt="ISKONI Logo" width="320" height="110" style="border-radius: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.8);" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=320&auto=format&fit=crop&q=80'" />

  <br /><br />

  <h1><b>I S K O N I</b></h1>
  <p><b>A high-performance, native-feel desktop cinema & episodic streaming suite.</b></p>

  <div>
    <a href="https://github.com/faithpoovathingal/iskoni-releases/releases/latest"><img src="https://img.shields.io/github/v/release/faithpoovathingal/iskoni-releases?color=E50914&label=Release&style=for-the-badge" alt="Latest Release" /></a>
    <a href="https://github.com/faithpoovathingal/iskoni-releases/releases/latest"><img src="https://img.shields.io/badge/Windows-10%20%7C%2011%20(x64)-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Windows" /></a>
    <a href="https://github.com/faithpoovathingal/iskoni-releases/releases/latest"><img src="https://img.shields.io/badge/macOS-Apple%20Silicon%20(M%20Series)-000000?style=for-the-badge&logo=apple&logoColor=white" alt="macOS" /></a>
    <a href="https://github.com/faithpoovathingal/iskoni-releases"><img src="https://img.shields.io/badge/Status-v1.0.9-10b981?style=for-the-badge" alt="Build Status" /></a>
  </div>

  <br />

  <div>
    <a href="https://github.com/faithpoovathingal/iskoni-releases/releases/download/v1.0.9/ISKONI_1.0.9.exe">
      <img src="https://img.shields.io/badge/Download-Windows%20Installer%20(.exe)-0078D6?style=for-the-badge&logo=windows&logoColor=white" height="38" alt="Download Windows Installer" />
    </a>
    &nbsp;
    <a href="https://github.com/faithpoovathingal/iskoni-releases/releases/download/v1.0.9/ISKONI_1.0.9.pkg">
      <img src="https://img.shields.io/badge/Download-macOS%20Package%20(.pkg)-E50914?style=for-the-badge&logo=apple&logoColor=white" height="38" alt="Download macOS PKG" />
    </a>
    &nbsp;
    <a href="https://github.com/faithpoovathingal/iskoni-releases/releases/download/v1.0.9/ISKONI_1.0.9.dmg">
      <img src="https://img.shields.io/badge/Download-macOS%20Disk%20Image%20(.dmg)-1f2937?style=for-the-badge&logo=apple&logoColor=white" height="38" alt="Download macOS DMG" />
    </a>
  </div>

</div>

<br />

---

### Overview

**ISKONI** is an ultra-fast desktop streaming workstation combining custom low-latency HLS pipeline engineering with deep UI polish. Powered by Electron and React, ISKONI delivers instant hardware-accelerated playback, multi-mirror source resolution, real-time cross-device cloud synchronization, and smart platform-tailored updates without ads or clutter.

---

### What's New in v1.0.9

| Module | Enhancements |
| :--- | :--- |
| **Hero Carousel** | Auto-advancing featured banner with dynamic backdrop blurring, rich meta cards, and responsive pagination indicators. |
| **Cloud Accounts** | Powered by Supabase. Sync display names, avatar presets, and watch history across all machines in real time. |
| **Avatar Studio** | Instant preset picker (Scorpion, Cat, Dog, Wolf, Lion, Eagle, Phoenix, Dragon) with automatic name initials generation. |
| **Interactive Search** | Dynamic hover-expand search pill: compact circular glass trigger at rest, expansive input on hover/focus. |
| **Server Engine** | Added high-bandwidth CDNs: **Luna**, **Astra**, and **Movy** with zero-buffer multi-mirror failover. |
| **Frosted Top Navigation** | Ultra-thin backdrop glassmorphism; settings moved to a dedicated right-aligned circular quick action. |
| **Action Layout** | Tactile redesign for **Play** and **+ Add to Watchlist** buttons with expanded catalog poster margins. |
| **Platform Packaging** | Native NSIS installer targeting `Program Files` with `icon.ico` branding alongside silent macOS packages. |

---

### Key Capabilities

* **Engineered HLS Engine:** Direct buffer streaming with zero mid-roll injections, live playback telemetry, precision timeline scrubbing, and adaptive 1080p HD stream switching.
* **Persistent Audio & Volume Control:** Native in-frame logarithmic volume slider and quick mute with cross-session volume retention.
* **Comprehensive Subtitle Customizer:**
  * Auto-selects **English 3** priority tracks with silent fallback to primary English.
  * Adjust timing offset ($\pm0.5\text{s}$ calibration steps), text size (S, M, L, XL), palette hues, and background bounding opacity.
  * Local storage synchronization ensures custom styling persists through restarts and OTA updates.
* **Episodic Flow & Drawers:**
  * **Up Next Card:** Auto-renders episode artwork with an interactive 15-second countdown during the final 45 seconds.
  * **Credit Shield ("Stay" Mode):** One-click dismissal of episode auto-advance to enjoy post-credit sequences cleanly.
  * **In-Player Episode Drawer:** Browse seasons and synopsis data without interrupting live playback.
* **Aspect Scaling:** Instant hotkey cycling across `contain`, `cover`, and `fill` viewports.
* **Cross-Language Catalogs:** Curated filtering across Malayalam, Hindi, Tamil, Telugu, English, Korean, and Japanese media feeds.
* **Intelligent OTA Updates:** Background version checks that automatically deliver OS-specific packages (`.exe` for Windows, `.pkg`/`.dmg` for macOS).

---

### Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> / <kbd>K</kbd> | Toggle Play / Pause |
| <kbd>←</kbd> / <kbd>→</kbd> | Seek Backward / Forward 10s |
| <kbd>A</kbd> | Cycle Aspect Ratio (`contain` • `cover` • `fill`) |
| <kbd>F</kbd> | Toggle Native Fullscreen |
| <kbd>T</kbd> | Trigger / Dismiss Up Next Card |
| <kbd>N</kbd> | Jump to Next Episode |
| <kbd>P</kbd> | Jump to Previous Episode |
| <kbd>Esc</kbd> | Exit Episode Drawer / Fullscreen / Video Player |

---

### Installation

#### Windows (10 / 11)

1. Grab **`ISKONI_1.0.9.exe`** from the [Latest Release](https://github.com/faithpoovathingal/iskoni-releases/releases/latest).
2. Run the installer. If prompted by Windows Defender SmartScreen, select **More info** → **Run anyway**.
3. The setup automatically installs ISKONI to your `Program Files` directory and registers clean Start Menu and Desktop shortcuts.

#### macOS (Apple Silicon M1 / M2 / M3 / M4)

* **PKG Installer (Recommended):**  
  Download **`ISKONI_1.0.9.pkg`**. Right-click (or <kbd>Control</kbd> + Click) the file, select **Open**, and complete the installation wizard to place ISKONI into `/Applications`.
* **DMG Disk Image:**  
  Download **`ISKONI_1.0.9.dmg`**, double-click the image, and drag **ISKONI.app** into your `/Applications` folder.

> **Gatekeeper Resolution:** If macOS prompts that the package is from an unidentified developer, right-click the app in `/Applications`, choose **Open**, and confirm. Alternatively, clear the quarantine flag via Terminal:
> ```bash
> xattr -cr /Applications/ISKONI.app
> ```

---

### Tech Stack

* **Shell & Core:** Electron, Node.js
* **Interface:** React, Tailwind CSS, Lucide Icons
* **Data & Cloud Sync:** Supabase (Auth, Profiles, Watch History, RLS)
* **Video Pipeline:** Hls.js, Custom Telemetry Controller
* **Metadata Engine:** The Movie Database (TMDB) API
* **Packaging:** Electron Builder, NSIS (Windows x64), Native macOS Toolchain

---

<div align="center">

  **Engineered by Faith Poovathingal**  
  [![GitHub](https://img.shields.io/badge/GitHub-faithpoovathingal-181717?style=flat-square&logo=github)](https://github.com/faithpoovathingal)

  <br />
  <sub>ISKONI is a media aggregator and stream client intended for educational and research usage. All media index data is retrieved via public APIs and third-party mirrors.</sub>

</div>
