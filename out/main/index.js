




let activeSeekTarget = 0;
let seekDispatched = false;

try {
  const { ipcMain } = require('electron');
  ipcMain.on('set-playback-seek', (_event, data) => {
    activeSeekTarget = (data && data.targetTime) ? Number(data.targetTime) : 0;
    seekDispatched = false;
    console.log('[Main Process] Playback resume target armed at ' + activeSeekTarget + 's');
  });

  ipcMain.on('clear-playback-seek', () => {
    activeSeekTarget = 0;
    seekDispatched = false;
  });
} catch (_) {}

function startDurationSync(win) {
  if (!win || !win.webContents) return;

  setInterval(() => {
    if (win.isDestroyed()) return;

    function getAllFrames(f) {
      if (!f) return [];
      let list = [f];
      if (Array.isArray(f.frames)) {
        for (const child of f.frames) {
          list = list.concat(getAllFrames(child));
        }
      }
      return list;
    }

    const allFrames = getAllFrames(win.webContents.mainFrame);

    for (const frame of allFrames) {
      frame.executeJavaScript(`
        (() => {
          const v = document.querySelector('video');
          if (v) {
            if (v.muted) v.muted = false;
            if (v.volume < 0.2 && v.volume > 0) v.volume = 1.0;
          }
          if (!v) return { videoFound: false };

          // 1. Playback Resume Injection
          let didSeek = false;
          if (${activeSeekTarget} > 15 && !${seekDispatched}) {
            if (v.readyState >= 1 && v.currentTime < 5 && (v.duration > 20 || isNaN(v.duration))) {
              try {
                v.currentTime = ${activeSeekTarget};
                didSeek = true;
              } catch (_) {}
            }
          }

          if (isNaN(v.duration) || !isFinite(v.duration) || v.duration <= 0) {
            return { videoFound: true, didSeek };
          }

          // 2. Timeline and duration sync
          if (!window.__iskoni_synced || Math.abs(window.__iskoni_last_duration - v.duration) > 1) {
            window.__iskoni_synced = true;
            window.__iskoni_last_duration = v.duration;
            const payload = { type: 'PLAYER_EVENT', event: 'timeupdate', currentTime: v.currentTime, duration: v.duration };
            window.top.postMessage(payload, '*');
            window.postMessage(payload, '*');
          }

          // 3. Regular telemetry heartbeat every 2s
          if (Math.floor(v.currentTime) % 2 === 0) {
            const beatPayload = { type: 'PLAYER_EVENT', event: 'timeupdate', currentTime: v.currentTime, duration: v.duration };
            window.top.postMessage(beatPayload, '*');
          }

          // 4. Auto-Next Detection
          const isFinished = v.ended || (v.duration > 10 && v.currentTime >= v.duration - 1.5);
          if (isFinished && !window.__iskoni_ended_dispatched) {
            window.__iskoni_ended_dispatched = true;
            const endPayload = { type: 'PLAYER_EVENT', event: 'ended', currentTime: v.duration, duration: v.duration };
            window.top.postMessage(endPayload, '*');
            window.postMessage(endPayload, '*');
            return { videoEnded: true, didSeek };
          }
          if (v.currentTime < v.duration - 5) {
            window.__iskoni_ended_dispatched = false;
          }
          return { videoEnded: false, didSeek };
        })()
      `).then((res) => {
        if (res && res.didSeek) {
          seekDispatched = true;
          console.log('[Main Process] Injected seek successful: resumed at ' + activeSeekTarget + 's');
        }
        if (res && res.videoEnded) {
          win.webContents.executeJavaScript(`
            (() => {
              const buttons = Array.from(document.querySelectorAll('button, [role="button"], a'));
              const nextBtn = buttons.find(el => {
                const text = (el.innerText || el.getAttribute('aria-label') || el.title || '').toLowerCase();
                return text.includes('next episode') || text.includes('play next') || text === 'next';
              });
              if (nextBtn) nextBtn.click();
            })()
          `).catch(() => {});
        }
      }).catch(() => {});
    }
  }, 1000);
}


// --- ISKONI Input Focus Engine ---
let isInputFocused = false;
const { ipcMain: iskoniIpc } = require('electron');
iskoniIpc.on('iskoni-input-focus', (_, focused) => {
  isInputFocused = Boolean(focused);
});

try {
  const electron = require('electron');
  const app = electron.app || (electron.default && electron.default.app);
  if (app) {
    app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
    app.commandLine.appendSwitch('disable-site-isolation-trials');
  }
} catch(_) {}



"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const fs = require("fs");
const https = require("https");
const http = require("http");
const child_process = require("child_process");
electron.app.commandLine.appendSwitch("ignore-certificate-errors");
electron.app.commandLine.appendSwitch("allow-insecure-localhost", "true");
electron.app.commandLine.appendSwitch("dns-result-order", "ipv4first");
let mainWindow = null;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 480,
    minHeight: 270,
    show: false,
    autoHideMenuBar: true,
    title: "ISKONI",
    backgroundColor: "#0f1014",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  });
  mainWindow.webContents.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  mainWindow.webContents.session.setCertificateVerifyProc((_request, callback) => {
    callback(0);
  });
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    delete responseHeaders["x-frame-options"];
    delete responseHeaders["X-Frame-Options"];
    delete responseHeaders["content-security-policy"];
    delete responseHeaders["Content-Security-Policy"];
    callback({
      cancel: false,
      responseHeaders
    });
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);

  // Block all popups, ad tabs, and unwanted new window redirects
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: "deny" };
  });

  // Strip known ad networks and popunder scripts
  const AD_BLOCK_URLS = [
    "*://*/*adkeeper*",
    "*://*/*popads*",
    "*://*/*popcash*",
    "*://*/*adsterra*",
    "*://*/*juicyads*",
    "*://*/*exoclick*",
    "*://*/*trafficjunky*",
    "*://*/*bet365*",
    "*://*/*onclickalgo*"
  ];

  electron.session.defaultSession.webRequest.onBeforeRequest(
    { urls: AD_BLOCK_URLS },
    (details, callback) => {
      callback({ cancel: true });
    }
  );


    mainWindow.on("enter-full-screen", () => mainWindow.webContents.send("window-fullscreen-changed", true));
    mainWindow.on("leave-full-screen", () => mainWindow.webContents.send("window-fullscreen-changed", false));


    mainWindow.webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown") {
        const targetKeys = ["f", "F", "t", "T", "n", "N", "p", "P", "Escape"];
        if (targetKeys.includes(input.key) && !input.control && !input.meta && !input.alt) {
          mainWindow.webContents.send("player-shortcut", input.key);
        }
      }
    });

  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, { headers: { "User-Agent": "ISKONI-App" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath, onProgress).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download update, status code: ${res.statusCode}`));
      }
      const totalBytes = parseInt(res.headers["content-length"] || "0", 10);
      let downloadedBytes = 0;
      const fileStream = fs.createWriteStream(destPath);
      res.on("data", (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const percent = Math.round(downloadedBytes / totalBytes * 100);
          onProgress(percent);
        }
      });
      res.pipe(fileStream);
      fileStream.on("finish", () => {
        fileStream.close(() => resolve());
      });
      fileStream.on("error", (err) => {
        fs.unlink(destPath, () => reject(err));
      });
    }).on("error", reject);
  });
}

  

  

  


  


  


  


  


  
/* FULLSCREEN_OVERLAY_START */
try { electron.ipcMain.removeHandler("toggle-fullscreen"); } catch {}
try { electron.ipcMain.removeHandler("is-fullscreen"); } catch {}

let isFsLocked = false;
electron.ipcMain.handle("toggle-fullscreen", (event) => {
  const win = electron.BrowserWindow.fromWebContents(event.sender);
  if (!win || isFsLocked) return win ? win.isFullScreen() : false;
  
  isFsLocked = true;
  const next = !win.isFullScreen();
  win.setFullScreen(next);
  setTimeout(() => { isFsLocked = false; }, 600);
  return next;
});

electron.ipcMain.handle("is-fullscreen", (event) => {
  const win = electron.BrowserWindow.fromWebContents(event.sender);
  return win ? win.isFullScreen() : false;
});

const NO_FOCUS_OUTLINE_CSS = " *:focus, *:focus-visible { outline: none !important; box-shadow: none !important; } ";
const mainKeyTimers = {};

electron.app.on("web-contents-created", (_event, contents) => {
  contents.on("did-finish-load", () => {
    contents.insertCSS(NO_FOCUS_OUTLINE_CSS).catch(() => {});
  });
  contents.on("did-frame-finish-load", () => {
    contents.insertCSS(NO_FOCUS_OUTLINE_CSS).catch(() => {});
  });

  // Strict 500ms main-process deduplication across all window frames & iframes
  contents.on("before-input-event", (_event, input) => {
    if (input.type === "keyDown" && !input.control && !input.meta && !input.alt) {
      const k = input.key.toLowerCase();
      if (["f", "t", "n", "p", "escape"].includes(k)) {
        const now = Date.now();
        if (mainKeyTimers[k] && now - mainKeyTimers[k] < 450) {
          return;
        }
        mainKeyTimers[k] = now;
        const wins = electron.BrowserWindow.getAllWindows();
        wins.forEach((w) => {
          if (!w.isDestroyed()) {
            w.webContents.send("player-shortcut", input.key);
          }
        });
      }
    }
  });
});
/* FULLSCREEN_OVERLAY_END */

  electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.faithpoovathingal.iskoni");
  electron.ipcMain.handle("get-app-version", () => electron.app.getVersion());
  electron.ipcMain.handle("toggle-pip", (_, enable) => {
    if (!mainWindow) return false;
    if (enable) {
      mainWindow.setAlwaysOnTop(true, "floating");
      mainWindow.setSize(520, 310);
      mainWindow.setAspectRatio(16 / 9);
    } else {
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setAspectRatio(0);
      mainWindow.setSize(1280, 800);
      mainWindow.center();
    }
    return true;
  });
  electron.ipcMain.handle("download-and-install-update", async (event, downloadUrl) => {
    try {
      const tempPkgPath = path.join(electron.app.getPath("temp"), "ISKONI-Update.pkg");
      await downloadFile(downloadUrl, tempPkgPath, (progress) => {
        event.sender.send("update-download-progress", progress);
      });
      child_process.exec(`open "${tempPkgPath}"`, () => {
        electron.app.quit();
      });
      return { success: true };
    } catch (err) {
      console.error("Update failed:", err);
      return { success: false, error: err.message };
    }
  });
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});


  // --- ISKONI Deep Recursive Video Engine ---
  async function performVideoAction(win, action) {
    if (!win || !win.webContents) return;

    // Recursively collect all frames (main, iframes, nested iframes)
    function getAllFrames(f) {
      if (!f) return [];
      let list = [f];
      if (Array.isArray(f.frames)) {
        for (const child of f.frames) {
          list = list.concat(getAllFrames(child));
        }
      }
      return list;
    }

    const allFrames = getAllFrames(win.webContents.mainFrame);
    
    let handled = false;
    for (const frame of allFrames) {
      try {
        const frameUrl = frame.url || '';
        const res = await frame.executeJavaScript(`
          (() => {
            function findVideoElement(root = document) {
              let v = root.querySelector('video');
              if (v) return v;
              // Check inside open Shadow Roots
              const all = root.querySelectorAll('*');
              for (const el of all) {
                if (el.shadowRoot) {
                  v = findVideoElement(el.shadowRoot);
                  if (v) return v;
                }
              }
              return null;
            }

            const video = findVideoElement();
            if (!video) return { found: false };

            let status = '';
            switch ('${action}') {
              case 'Space':
                if (video.paused) {
                  video.play();
                  status = 'PLAYING (pos: ' + Math.round(video.currentTime) + 's)';
                } else {
                  video.pause();
                  status = 'PAUSED (pos: ' + Math.round(video.currentTime) + 's)';
                }
                break;
              case 'ArrowLeft':
                video.currentTime = Math.max(0, video.currentTime - 10);
                status = 'SEEK BACK -> ' + Math.round(video.currentTime) + 's';
                break;
              case 'ArrowRight':
                video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
                status = 'SEEK FWD -> ' + Math.round(video.currentTime) + 's';
                break;
              case 'ArrowUp':
                video.volume = Math.min(1, Number((video.volume + 0.1).toFixed(2)));
                video.muted = false;
                status = 'VOL UP -> ' + Math.round(video.volume * 100) + '%';
                break;
              case 'ArrowDown':
                video.volume = Math.max(0, Number((video.volume - 0.1).toFixed(2)));
                status = 'VOL DOWN -> ' + Math.round(video.volume * 100) + '%';
                break;
              case 'm':
                video.muted = !video.muted;
                status = 'MUTED: ' + video.muted;
                break;
            }
            return { found: true, status: status, url: window.location.href };
          })()
        `);

        if (res && res.found) {
                    handled = true;
          break;
        }
      } catch (err) {}
    }

    if (!handled) {
          }
  }

  // Hook all window creations universally
  try {
    const electron = require('electron');
    const app = electron.app || (electron.default && electron.default.app);
    if (app) {
      app.on('browser-window-created', (_, targetWin) => {

  // Safe isolated player top controls spacer
  targetWin.webContents.on('did-finish-load', () => {
    targetWin.webContents.executeJavaScript(`
      (() => {
        setInterval(() => {
          // Look strictly for server button containing "VidLink"
          const allElements = Array.from(document.querySelectorAll('button, span, div'));
          const vidlink = allElements.find(el => el.textContent && el.textContent.includes('VidLink') && el.children.length === 0);
          
          if (vidlink) {
            const bar = vidlink.closest('div.flex') || vidlink.parentElement.closest('div');
            if (bar && bar.children.length >= 3) {
              bar.style.setProperty('display', 'flex', 'important');
              bar.style.setProperty('align-items', 'center', 'important');
              bar.style.setProperty('gap', '12px', 'important');
              Array.from(bar.children).forEach(child => {
                child.style.setProperty('margin-left', '3px', 'important');
                child.style.setProperty('margin-right', '3px', 'important');
                child.style.setProperty('flex-shrink', '0', 'important');
              });
            }
          }
        }, 300);
      })()
    `).catch(() => {});
  });

      startDurationSync(targetWin);

  // Dynamic UI & Focus Controller
  targetWin.webContents.on('did-finish-load', () => {
    targetWin.webContents.executeJavaScript(`
      (() => {
        const { ipcRenderer } = require('electron');

        // 1. Search Bar Focus Tracking (Allows Typing Spaces)
        document.addEventListener('focusin', (e) => {
          if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName) || e.target?.isContentEditable) {
            ipcRenderer.send('iskoni-input-focus', true);
          }
        }, true);

        document.addEventListener('focusout', (e) => {
          ipcRenderer.send('iskoni-input-focus', false);
        }, true);

        // 2. Safe Player Top-Right Controls Spacing (Strictly when player is mounted)
        setInterval(() => {
          const hasPlayer = document.querySelector('iframe, video');
          if (!hasPlayer) return;

          const allElements = Array.from(document.querySelectorAll('button, div, span'));
          const serverBtn = allElements.find(el => el.textContent && el.textContent.includes('VidLink') && el.children.length === 0);
          if (serverBtn) {
            const bar = serverBtn.closest('div[class*="flex"]');
            if (bar && bar.children.length >= 3) {
              bar.style.setProperty('display', 'flex', 'important');
              bar.style.setProperty('align-items', 'center', 'important');
              bar.style.setProperty('gap', '12px', 'important');
              Array.from(bar.children).forEach(child => {
                child.style.setProperty('margin-left', '4px', 'important');
                child.style.setProperty('margin-right', '4px', 'important');
                child.style.setProperty('flex-shrink', '0', 'important');
              });
            }
          }
        }, 400);

        // 3. Dynamic "No Results Found" Handler
        setInterval(() => {
          const searchInput = document.querySelector('input[type="text"], input[type="search"], input[placeholder*="Search"]');
          if (!searchInput) return;

          const query = (searchInput.value || '').trim();
          const grid = document.querySelector('div[class*="grid"], [class*="catalog"]');
          const existingMsg = document.getElementById('iskoni-no-results-msg');

          if (query.length > 0) {
            const cards = grid ? grid.querySelectorAll('[class*="card"], [class*="group"], [class*="cursor-pointer"]') : [];
            if (grid && cards.length === 0) {
              if (!existingMsg) {
                const msg = document.createElement('div');
                msg.id = 'iskoni-no-results-msg';
                msg.className = 'col-span-full flex flex-col items-center justify-center py-20 text-center';
                msg.innerHTML = \`
                  <div class="p-4 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                  </div>
                  <h3 class="text-xl font-bold text-white mb-2">No results found</h3>
                  <p class="text-sm text-zinc-400 max-w-md">We couldn't find anything matching "<span class="text-red-400 font-semibold">\${query}</span>". Check spelling or search another title.</p>
                \`;
                grid.appendChild(msg);
              }
            } else if (existingMsg) {
              existingMsg.remove();
            }
          } else if (existingMsg) {
            existingMsg.remove();
          }
        }, 300);
      })()
    `).catch(() => {});
  });

        let lastFsToggle = 0;

      targetWin.webContents.on('before-input-event', (event, input) => {
        if (input.type !== 'keyDown' || input.isAutoRepeat) return;
        if (isInputFocused) return; // Allow spacebar & text navigation in search inputs
        const key = input.key;
        const map = {
          ' ': 'Space',
          'Space': 'Space',
          'ArrowLeft': 'ArrowLeft',
          'ArrowRight': 'ArrowRight',
          'ArrowUp': 'ArrowUp',
          'ArrowDown': 'ArrowDown',
          'm': 'm',
          'M': 'm'
        };

        const action = map[key];
        if (action) {
          event.preventDefault();
          performVideoAction(targetWin, action);
        }
      });
    });
    }
  } catch(e) {
    console.error("Hook setup error:", e);
  }

// Streamflix Extension
try {
  const streamflixResolver = require('./streamflixResolver');
  const { ipcMain, session, app } = require('electron');

  if (ipcMain) {
    ipcMain.handle('resolve-direct-streams', async (_e, p) => {
      try {
        return await streamflixResolver.resolveDirectStreams(p?.tmdbId, p?.isTv, p?.season, p?.episode);
      } catch (_) {
        return [];
      }
    });
    ipcMain.handle('fetch-direct-subtitles', async (_e, p) => {
      try {
        return await streamflixResolver.fetchDirectSubtitles(p?.tmdbId, p?.isTv, p?.season, p?.episode);
      } catch (_) {
        return [];
      }
    });
  }

  if (app) {
    app.whenReady().then(() => {
      try {
        const filter = { urls: ['*://*.ngcorp.dad/*', '*://*.streamrk.site/*', '*://*.workers.dev/*', '*://*.vdrk.site/*', '*://*.vidrock.net/*'] };
        session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
          details.requestHeaders['Referer'] = 'https://vidrock.net/';
          details.requestHeaders['Origin'] = 'https://vidrock.net';
          details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36';
          callback({ requestHeaders: details.requestHeaders });
        });
      } catch (_) {}
    });
  }
} catch (_) {}




// ==========================================
// 🚀 Native Auto-Updater & PKG Downloader IPC
// ==========================================
(function() {
  const { shell: _shell, ipcMain: _ipcMain, app: _app } = require('electron');
  const _https = require('https');
  const _http = require('http');
  const _fs = require('fs');
  const _path = require('path');
  const { exec: _exec } = require('child_process');

  if (!_ipcMain) return;

  // Prevent duplicate handler registration crashes
  _ipcMain.removeHandler('OPEN_UPDATE_URL');
  _ipcMain.removeHandler('DOWNLOAD_AND_INSTALL_PKG');

  // Handler to open release in default browser
  _ipcMain.handle('OPEN_UPDATE_URL', async (_e, url) => {
    if (url) {
      await _shell.openExternal(url);
      return { success: true };
    }
    return { success: false, error: 'No URL provided' };
  });

  // Handler to download .pkg directly to Downloads and trigger macOS installer
  _ipcMain.handle('DOWNLOAD_AND_INSTALL_PKG', async (_event, downloadUrl) => {
    return new Promise((resolve) => {
      try {
        if (!downloadUrl) {
          return resolve({ success: false, error: 'No download URL provided' });
        }

        const fileName = _path.basename(downloadUrl.split('?')[0]) || 'ISKONI_1.0.6.pkg';
        const destPath = _path.join(_app.getPath('downloads'), fileName);
        const fileStream = _fs.createWriteStream(destPath);

        function makeRequest(targetUrl) {
          const client = targetUrl.startsWith('https') ? _https : _http;
          client.get(targetUrl, (res) => {
            // Handle GitHub Release 302 redirects to AWS S3
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              return makeRequest(res.headers.location);
            }

            if (res.statusCode !== 200) {
              fileStream.close();
              _fs.unlink(destPath, () => {});
              return resolve({ success: false, error: 'HTTP Status ' + res.statusCode });
            }

            res.pipe(fileStream);

            fileStream.on('finish', () => {
              fileStream.close(() => {
                // Launch downloaded PKG with macOS installer
                _exec('open "' + destPath + '"', (err) => {
                  if (err) {
                    _shell.openPath(destPath);
                  }
                  resolve({ success: true, path: destPath });
                });
              });
            });
          }).on('error', (err) => {
            fileStream.close();
            _fs.unlink(destPath, () => {});
            resolve({ success: false, error: err.message });
          });
        }

        makeRequest(downloadUrl);
      } catch (err) {
        resolve({ success: false, error: err.message });
      }
    });
  });
})();
