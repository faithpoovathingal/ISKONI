
async function fetchTorrentBuffer(hash) {
  if (!hash || hash.length !== 40) return null;
  const upper = hash.toUpperCase();
  const endpoints = [
    "https://itorrents.org/torrent/" + upper + ".torrent",
    "http://torrage.info/torrent.php?h=" + upper
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (res.ok) {
        const arr = await res.arrayBuffer();
        if (arr.byteLength > 100) {
          console.log("[Torrent Engine] Successfully pre-fetched .torrent from cache:", url);
          return Buffer.from(arr);
        }
      }
    } catch (_) {}
  }
  return null;
}

let statInterval = null;

function cleanMagnetUri(uri) {
  if (typeof uri !== "string") return uri;
  let decoded = uri;
  while (decoded.includes("%25") || decoded.includes("%3A") || decoded.includes("%3a")) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch (_) {
      break;
    }
  }
  return decoded;
}
const http = require('http');

let client = null;
let currentTorrent = null;
let currentServer = null;

async function getClient() {
  if (!client) {
    const { default: WebTorrent } = await import('webtorrent');
    client = new WebTorrent({
      maxConns: 150,
      dht: true,
      lsd: true,
      utp: true
    });
    client.on('error', (err) => console.error('[TorrentEngine] Client error:', err.message));
  }
  return client;
}

async function stopTorrent() {
  if (statInterval) {
    clearInterval(statInterval);
    statInterval = null;
  }

  // 1. Fully tear down previous HTTP streaming server
  if (currentServer) {
    const srv = currentServer;
    currentServer = null;
    await new Promise((resolve) => {
      try {
        if (typeof srv.closeAllConnections === "function") {
          srv.closeAllConnections();
        }
        srv.close(() => resolve());
      } catch (_) {
        resolve();
      }
      // Safety timeout: never let socket drain block for more than 500ms
      setTimeout(resolve, 500);
    });
  }

  // 2. Fully destroy active torrent swarm
  if (currentTorrent) {
    const tor = currentTorrent;
    currentTorrent = null;
    await new Promise((resolve) => {
      try {
        tor.destroy({ destroyStore: true }, () => resolve());
      } catch (_) {
        resolve();
      }
      setTimeout(resolve, 500);
    });
  }

  return true;
}

async function startTorrent(rawIdentifier) {
  const torrentIdentifier = cleanMagnetUri(rawIdentifier);
  await stopTorrent();
  const engine = await getClient();

  // Extract infoHash to attempt cache pre-fetch
  let infoHash = null;
  const hashMatch = typeof torrentIdentifier === "string" ? torrentIdentifier.match(/xt=urn:btih:([a-fA-F0-9]{40})/i) : null;
  if (hashMatch) {
    infoHash = hashMatch[1].toUpperCase();
  }
  let torrentPayload = torrentIdentifier;
  if (infoHash) {
    const cachedBuffer = await fetchTorrentBuffer(infoHash);
    if (cachedBuffer) {
      torrentPayload = cachedBuffer;
    }
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Swarm metadata connection timed out.'));
    }, 15000);

    
        const defaultTrackers = [
      "udp://tracker.opentrackr.org:1337/announce",
      "udp://open.stealth.si:80/announce",
      "udp://tracker.torrent.eu.org:451/announce",
      "udp://explodie.org:6969/announce",
      "udp://tracker.coppersurfer.tk:6969/announce",
      "udp://tracker.openbittorrent.com:6969/announce",
      "udp://tracker.dler.org:6969/announce",
      "http://tracker.openbittorrent.com:80/announce"
    ];
    let resolvedIdentifier = torrentIdentifier;
    if (typeof torrentIdentifier === "string") {
      const defaultTrackers = [
        "udp://tracker.opentrackr.org:1337/announce",
        "udp://open.stealth.si:80/announce",
        "udp://tracker.torrent.eu.org:451/announce",
        "udp://explodie.org:6969/announce",
        "udp://tracker.openbittorrent.com:6969/announce",
        "udp://tracker.dler.org:6969/announce",
        "http://tracker.openbittorrent.com:80/announce"
      ];
      defaultTrackers.forEach(tr => {
        if (!resolvedIdentifier.includes(tr)) {
          resolvedIdentifier += "&tr=" + encodeURIComponent(tr);
        }
      });
    }
    console.log("[Torrent Engine] Final Announce URI:", resolvedIdentifier.substring(0, 100) + "...");
    engine.add(torrentPayload instanceof Buffer ? torrentPayload : resolvedIdentifier, { announce: defaultTrackers }, (torrent) => {
      clearTimeout(timeout);
      currentTorrent = torrent;

      // Swarm health monitor
      statInterval = setInterval(() => {
        if (!currentTorrent || currentTorrent.destroyed) {
          clearInterval(statInterval);
          return;
        }
        const speedMb = (currentTorrent.downloadSpeed / (1024 * 1024)).toFixed(2);
        const peers = currentTorrent.numPeers;
        const progress = (currentTorrent.progress * 100).toFixed(1);
        console.log(`[Swarm Stats] Peers: ${peers} | Down: ${speedMb} MB/s | Progress: ${progress}%`);
      }, 2000);

      // Select largest video file (.mp4 or .mkv)
      // Case-insensitive check across all common video container formats
      const videoExtensions = [".mp4", ".mkv", ".webm", ".avi", ".ts", ".m4v", ".mov"];
      let file = torrent.files
        .filter(f => {
          const lower = f.name.toLowerCase();
          return videoExtensions.some(ext => lower.endsWith(ext));
        })
        .sort((a, b) => b.length - a.length)[0];

      // Fallback: If extensions do not match standard naming, pick the single largest file > 50MB
      if (!file) {
        const largest = torrent.files.slice().sort((a, b) => b.length - a.length)[0];
        if (largest && largest.length > 50 * 1024 * 1024) {
          file = largest;
        }
      }

      if (!file) {
        stopTorrent();
        return reject(new Error('No compatible video stream found in release.'));
      }

      // Prioritize first and last pieces with top priority for container (moov atom) headers
      file.select();
      try {
        const startPiece = file._startPiece;
        const endPiece = file._endPiece;
        const headEnd = Math.min(startPiece + 4, endPiece);
        const tailStart = Math.max(endPiece - 4, startPiece);

        // Max priority on container headers
        torrent.select(startPiece, headEnd, 3);
        torrent.select(tailStart, endPiece, 3);
      } catch (e) {
        console.warn("[TorrentEngine] Header piece prioritization fallback:", e.message);
      }

      const server = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          return res.end();
        }

        if (req.method === 'HEAD') {
          res.writeHead(200, {
            'Accept-Ranges': 'bytes',
            'Content-Length': file.length,
            'Content-Type': 'video/mp4'
          });
          return res.end();
        }

        const range = req.headers.range;
        let stream;

        if (!range) {
          res.writeHead(200, {
            'Accept-Ranges': 'bytes',
            'Content-Length': file.length,
            'Content-Type': 'video/mp4'
          });
          stream = file.createReadStream();
        } else {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
          const chunksize = (end - start) + 1;

          // Dynamically prioritize pieces for the seeked range
          const pieceLength = torrent.pieceLength || (1024 * 1024);
          const startPiece = file._startPiece + Math.floor(start / pieceLength);
          const endPiece = file._startPiece + Math.floor(end / pieceLength);

          try {
            const maxPiece = Math.max(0, torrent.pieces.length - 1);
            const clampedStart = Math.min(startPiece, maxPiece);
            const clampedEnd = Math.min(endPiece, maxPiece);

            // 1. Immediate piece: highest critical priority
            const criticalEnd = Math.min(clampedStart + 3, clampedEnd);
            torrent.select(clampedStart, criticalEnd, 3);

            // 2. Forward stream lookahead: high priority
            const forwardEnd = Math.min(clampedStart + 20, maxPiece);
            if (criticalEnd < forwardEnd) {
              torrent.select(criticalEnd + 1, forwardEnd, 2);
            }
          } catch (selErr) {
            console.warn("[TorrentEngine] Seek priority error:", selErr.message);
          }

          res.writeHead(206, {
            "Content-Range": "bytes " + start + "-" + end + "/" + file.length,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": "video/mp4"
          });
          stream = file.createReadStream({ start, end });
        }

        stream.on('error', (err) => {
          if (err.code !== 'PREMATURE_CLOSE') {
            console.error('[TorrentEngine] Stream pipe error:', err.message);
          }
        });

        req.on('close', () => {
          try { stream.destroy(); } catch (_) {}
        });

        stream.pipe(res).on('error', () => {
          try { stream.destroy(); } catch (_) {}
        });
      });

      server.listen(8989, "127.0.0.1", () => {
        clearTimeout(timeout);
        currentServer = server;
        console.log("[TorrentEngine] WebTorrent Stream Server active on http://127.0.0.1:8989");
        resolve({
          url: 'http://127.0.0.1:8989/video.mp4',
          fileName: file.name,
          fileSize: file.length,
          infoHash: torrent.infoHash
        });
      });

      server.on('error', (err) => {
        console.error("[TorrentEngine] HTTP server error:", err.message);
        if (!currentServer) {
          try { reject(err); } catch (_) {}
        }
      });

      server.on('clientError', (err, socket) => {
        if (!socket.destroyed) {
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        }
      });
    });
  });
}

module.exports = {
  startTorrent,
  stopTorrent
};
