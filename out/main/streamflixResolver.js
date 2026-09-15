const crypto = require('crypto');

const MAIN_URL = 'https://vidrock.net';
const STREAM_KEY = Buffer.from('7f3e9c2a8b5d1f4e6a9c3b7d2e5f8a1c4b6d9e2f5a8c1b4d7e9f2a5c8b1d4e7f', 'hex');
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36';

function base64ToBuffer(str, urlSafe = false) {
  let b64 = urlSafe ? str.replace(/-/g, '+').replace(/_/g, '/') : str;
  while (b64.length % 4 !== 0) b64 += '=';
  return Buffer.from(b64, 'base64');
}

function decryptVidrockUrl(payload) {
  try {
    const packed = base64ToBuffer(payload, true);
    if (packed.length < 28) return null;
    const nonce = packed.subarray(0, 12);
    const tag = packed.subarray(packed.length - 16);
    const ciphertext = packed.subarray(12, packed.length - 16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', STREAM_KEY, nonce);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(ciphertext, null, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted.trim();
  } catch (_) {
    return null;
  }
}

async function resolveDirectStreams(tmdbId, isTv = false, season = 1, episode = 1) {
  const url = isTv
    ? `${MAIN_URL}/api/tv/${tmdbId}/${season}/${episode}`
    : `${MAIN_URL}/api/movie/${tmdbId}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': `${MAIN_URL}/`,
        'Origin': MAIN_URL,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) return [];
    const body = await res.json();
    const results = [];

    const priority = ['orion', 'nova', 'luna', 'astra', 'lyra', 'atlas'];
    const entries = Object.entries(body).sort(([aName], [bName]) => {
      const aIdx = priority.indexOf(aName.toLowerCase());
      const bIdx = priority.indexOf(bName.toLowerCase());
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });

    for (const [name, data] of entries) {
      if (!data?.url) continue;
      let streamUrl = decryptVidrockUrl(data.url);
      if (!streamUrl) continue;

      if (/^https?:\/\//i.test(streamUrl)) {
        results.push({
          id: `streamflix-${name.toLowerCase()}`,
          name: `${name} (Direct Stream) ⭐`,
          language: data.language || 'English',
          kind: (data.type === 'hls' || streamUrl.includes('.m3u8')) ? 'hls' : 'file',
          uri: streamUrl
        });
      }
    }
    return results;
  } catch (_) {
    return [];
  }
}

async function fetchDirectSubtitles(tmdbId, isTv = false, season = 1, episode = 1) {
  const subUrl = isTv
    ? `https://sub.vdrk.site/v1/tv/${tmdbId}/${season}/${episode}`
    : `https://sub.vdrk.site/v1/movie/${tmdbId}`;

  try {
    const res = await fetch(subUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return [];
    const subs = await res.json();
    if (!Array.isArray(subs)) return [];
    
    return subs.map((s, idx) => ({
      id: `vdrk-${idx}`,
      label: s.label || 'Unknown',
      file: s.file || '',
      language: s.label ? s.label.toLowerCase() : 'english'
    })).filter(s => s.file);
  } catch (_) {
    return [];
  }
}

module.exports = {
  resolveDirectStreams,
  fetchDirectSubtitles
};
