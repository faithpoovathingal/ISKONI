
// --- ISKONI Input Focus Bridge (Preload Context) ---
try {
  const { ipcRenderer } = require('electron');
  window.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('focusin', (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) {
        ipcRenderer.send('iskoni-input-focus', true);
      }
    }, true);

    document.addEventListener('focusout', (e) => {
      ipcRenderer.send('iskoni-input-focus', false);
    }, true);
  });
} catch (_) {}

"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  onFullscreenChanged: (callback) => {
    const listener = (_event, state) => callback(state);
    electron.ipcRenderer.on("window-fullscreen-changed", listener);
    return () => electron.ipcRenderer.removeListener("window-fullscreen-changed", listener);
  },

  toggleFullscreen: () => electron.ipcRenderer.invoke("toggle-fullscreen"),
  isFullscreen: () => electron.ipcRenderer.invoke("is-fullscreen"),
  onPlayerShortcut: (callback) => {
    const listener = (_event, key) => callback(key);
    electron.ipcRenderer.on("player-shortcut", listener);
    return () => electron.ipcRenderer.removeListener("player-shortcut", listener);
  },

  getAppVersion: () => electron.ipcRenderer.invoke("get-app-version"),
  openExternal: (url) => electron.shell.openExternal(url),
  togglePiP: (enable) => electron.ipcRenderer.invoke("toggle-pip", enable),
  downloadAndInstallUpdate: (downloadUrl) => electron.ipcRenderer.invoke("download-and-install-update", downloadUrl),
  onUpdateProgress: (callback) => {
    const listener = (_, progress) => callback(progress);
    electron.ipcRenderer.on("update-download-progress", listener);
    return () => {
      electron.ipcRenderer.removeListener("update-download-progress", listener);
    };
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}

// Streamflix Preload Bridge
try {
  const streamflixBridge = {
    resolveStreams: (p) => electron.ipcRenderer.invoke('resolve-direct-streams', p),
    fetchSubtitles: (p) => electron.ipcRenderer.invoke('fetch-direct-subtitles', p)
  };
  if (process.contextIsolated) {
    try { electron.contextBridge.exposeInMainWorld('streamflix', streamflixBridge); } catch (_) { window.streamflix = streamflixBridge; }
  } else {
    window.streamflix = streamflixBridge;
  }
} catch (_) {}
