/**
 * Shared Instagram CDN helpers (stream to temp file, detect media type)
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const { getTempDir } = require('./tempManager');

const MAX_BYTES = 100 * 1024 * 1024;

// Stream IG CDN media to a temp file (no full-buffer in RAM -> avoids OOM kill, exit 137).
// Referer/Origin needed or CDN returns HTML. Validate type/size before use.
async function fetchMediaFile(mediaUrl, isVideo, maxBytes = MAX_BYTES) {
  const dir = getTempDir();
  const filePath = path.join(dir, `ig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${isVideo ? 'mp4' : 'jpg'}`);

  const res = await axios.get(mediaUrl, {
    responseType: 'stream',
    timeout: 30000,
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 300,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://www.instagram.com/',
      'Origin': 'https://www.instagram.com',
      'Accept': isVideo ? 'video/mp4,video/*,*/*;q=0.8' : 'image/avif,image/webp,image/*,*/*;q=0.8'
    }
  });

  try {
    const contentType = (res.headers['content-type'] || '').toLowerCase();
    const expectedPrefix = isVideo ? 'video/' : 'image/';
    if (/text\/html/.test(contentType)) {
      throw new Error('blocked: got HTML page instead of media (IG CDN rejected request)');
    }
    if (contentType && !contentType.startsWith(expectedPrefix) && contentType !== 'application/octet-stream') {
      throw new Error(`unexpected content-type: ${contentType}`);
    }
    const declared = parseInt(res.headers['content-length'] || '0', 10);
    if (declared > maxBytes) throw new Error(`file too large: ${(declared / 1048576).toFixed(1)}MB`);

    let received = 0;
    res.data.on('data', (c) => {
      received += c.length;
      if (received > maxBytes) res.data.destroy(new Error('file too large'));
    });
    await pipeline(res.data, fs.createWriteStream(filePath));

    if (fs.statSync(filePath).size < 512) throw new Error('suspiciously small file');
    return filePath;
  } catch (err) {
    fs.promises.unlink(filePath).catch(() => {});
    throw err;
  }
}

// IG CDN urls have no extension; ask the CDN what it is. Returns 'video' | 'image' | null
async function detectMediaType(mediaUrl) {
  try {
    const res = await fetch(mediaUrl, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.startsWith('video/')) return 'video';
    if (contentType.startsWith('image/')) return 'image';
  } catch (e) { /* fall through */ }
  return null;
}

module.exports = { fetchMediaFile, detectMediaType };
