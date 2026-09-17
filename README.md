<div align="center">

  <img src="https://raw.githubusercontent.com/faithpoovathingal/iskoni-releases/main/assets/logo.png" alt="ISKONI Logo" width="280" height="100" style="border-radius: 45px; box-shadow: 0 10px 30px;" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&auto=format&fit=crop&q=80'" />
  
  **A high-performance, lightweight cinema & TV streaming desktop client.**

  [![Latest Release](https://img.shields.io/github/v/release/faithpoovathingal/iskoni-releases?color=E50914&label=Version&style=for-the-badge)](https://github.com/faithpoovathingal/iskoni-releases/releases/latest)
  [![Platform Windows](https://img.shields.io/badge/Platform-Windows%2010%2F11%20(x64)-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/faithpoovathingal/iskoni-releases/releases/latest)
  [![Platform macOS](https://img.shields.io/badge/Platform-macOS%20Apple%20Silicon%20(M1%2FM2%2FM3%2FM4)-black?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/faithpoovathingal/iskoni-releases/releases/latest)
  [![Status](https://img.shields.io/badge/Status-Active%20v1.0.8-red?style=for-the-badge)](https://github.com/faithpoovathingal/iskoni-releases)

  <br />

  <a href="https://github.com/faithpoovathingal/iskoni-releases/releases/latest">
    <img src="https://img.shields.io/badge/Download_Windows_Setup_(.exe)-0078D6?style=for-the-badge&logo=windows&logoColor=white" height="40" alt="Download Windows EXE" />
  </a>
  <a href="https://github.com/faithpoovathingal/iskoni-releases/releases/latest">
    <img src="https://img.shields.io/badge/Download_macOS_Installer_(.pkg)-E50914?style=for-the-badge&logo=apple&logoColor=white" height="40" alt="Download PKG" />
  </a>
  <a href="https://github.com/faithpoovathingal/iskoni-releases/releases/latest">
    <img src="https://img.shields.io/badge/Download_Disk_Image_(.dmg)-1f2937?style=for-the-badge&logo=apple&logoColor=white" height="40" alt="Download DMG" />
  </a>

</div>

---

## 📽️ About ISKONI

**ISKONI** is an Electron and React-powered desktop streaming client engineered for clean, bufferless entertainment. Built with a custom native HLS playback engine, seamless TMDB discovery, persistent subtitle customization, direct multi-server failover resolvers, dynamic in-frame volume control, and automated background update delivery.

---

## ✨ Key Features

- 🎬 **Custom Built-In Native Player:** Fully integrated direct HLS player delivering ad-free playback, live buffer telemetry, precise scrubbing, and adaptive quality switching up to 1080p HD.
- 🔊 **Dynamic In-Player Volume & Audio Slider:** Native volume slider and mute controls injected directly into player streams with state persistence across playback sessions.
- 💬 **Advanced Subtitle Engine & Memory:**
  - **Smart Default:** Prioritizes **English 3** tracks automatically on launch, falling back cleanly to standard English when needed.
  - **Cross-Session Memory:** Saves your subtitle selection to persistent local storage across resumes, restarts, and app updates.
  - **Style & Sync Customizer:** In-player calibration for timing offset (±0.5s), font sizing (S, M, L, XL), text color palettes, and box background opacity.
- ⚡ **Direct Multi-Server Pipeline:** Instant failover across high-speed streaming CDNs with streamlined badges: **VidLink (Primary)**, **Movy (Fast)**, and **CineSRC (Mirror)**.
- ⏭️ **Smart Up Next Prompt:** Automated card preview with episode artwork and a 15-second countdown during the final 45 seconds of a TV show.
- 🛑 **"Stay" Credit Mode:** Dismiss auto-advance prompts with one click to finish watching post-credit scenes uninterrupted.
- 📺 **In-Player Episode Drawer:** Browse seasons and full episode lists with rich artwork without exiting active playback.
- 🖥️ **Aspect Ratio & Display Control:** Instant aspect-ratio cycling (`contain`, `cover`, `fill`) with keybind support and clean fullscreen integration.
- 🔖 **My List & Watchlist:** Bookmark movies and TV shows for instant offline access.
- 🕒 **Precision Resume Engine:** Automatically saves playback progress to pick up seamlessly where you left off.
- 🔄 **Direct One-Click OTA Updates:** In-app update notifications with a dedicated **Update Now** action that downloads and launches new installers automatically.
- 🔍 **Multi-Language Discovery:** Fast filtering across Malayalam, Hindi, Tamil, Telugu, English, Korean, and Japanese catalogs.

---

## ⌨️ Media Shortcuts

| Key | Action |
| :--- | :--- |
| <kbd>Space</kbd> / <kbd>K</kbd> | Play / Pause |
| <kbd>←</kbd> / <kbd>→</kbd> | Seek Backward / Forward 10 Seconds |
| <kbd>A</kbd> | Cycle Aspect Ratio (`contain` / `cover` / `fill`) |
| <kbd>F</kbd> | Toggle Fullscreen |
| <kbd>T</kbd> | Toggle / Preview Up Next Card |
| <kbd>N</kbd> | Jump to Next Episode |
| <kbd>P</kbd> | Jump to Previous Episode |
| <kbd>Esc</kbd> | Close Episode Drawer / Exit Fullscreen / Exit Player |

---

## 📥 Installation Guide

### 🪟 Windows (10 / 11)

1. Open the **[Latest Release](https://github.com/faithpoovathingal/iskoni-releases/releases/latest)** page.
2. Download **`ISKONI_1.0.8.exe`**.
3. Launch the installer.  
   *(If Windows Defender SmartScreen shows a prompt, click **More info** → **Run anyway**).*
4. Select your installation folder and choose your desktop shortcut preferences.
5. Launch **ISKONI** directly from your Desktop or Start Menu.

---

### 🍎 macOS (Apple Silicon)

#### Option 1: PKG Installer (Recommended)
1. Open the **[Latest Release](https://github.com/faithpoovathingal/iskoni-releases/releases/latest)** page.
2. Download **`ISKONI_1.0.8.pkg`**.
3. **Right-Click (or Control + Click)** the downloaded `.pkg` file and select **Open**.
4. Follow the installation steps to place ISKONI into your `/Applications` directory.

#### Option 2: DMG Disk Image
1. Download **`ISKONI_1.0.8.dmg`**.
2. Double-click the DMG and drag **ISKONI.app** into `/Applications`.

> **Gatekeeper Notice:** If macOS warns that the app cannot be opened because it is from an unidentified developer, right-click the app in `/Applications`, click **Open**, and confirm **Open** in the dialog. Alternatively, remove the quarantine flag via Terminal:
> ```bash
> xattr -cr /Applications/ISKONI.app
> ```

---

## 👨‍💻 Developer & Credits

Designed and engineered by **Faith Poovathingal**.

- **GitHub:** [@faithpoovathingal](https://github.com/faithpoovathingal)
- **Architecture:** Electron, React, TypeScript, Tailwind CSS, Hls.js, TMDB API

---

<div align="center">
  <sub>Disclaimer: ISKONI is built purely as an educational media aggregator and client. All media metadata is provided via the TMDB API and dynamic third-party resolvers.</sub>
</div>
