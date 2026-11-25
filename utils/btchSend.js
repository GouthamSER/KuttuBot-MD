/**
 * Shared command factory for btch-backed downloaders (twitter, threads, soundcloud, ...).
 * Response shapes differ per platform, so media urls are found by walking the JSON, each url is
 * probed (HEAD) to learn type/size, then sent as video / audio / image / document.
 */
const axios = require('axios');
const config = require('../config');
const { btch } = require('./btch');
const { collectUrls } = require('./providers');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MAX_SEND = 100 * 1024 * 1024;
const MAX_ITEMS = 6;
const EXT = {
  video: /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i,
  audio: /\.(mp3|m4a|aac|ogg|opus|wav)(\?|$)/i,
  image: /\.(jpe?g|png|webp|gif)(\?|$)/i
};

const human = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');

async function probe(url) {
  const headers = { 'User-Agent': UA, Accept: '*/*' };
  let res;
  try {
    res = await axios.head(url, { headers, timeout: 12000, maxRedirects: 5, validateStatus: () => true });
    if (res.status >= 400) throw new Error('head ' + res.status);
  } catch {
    try {
      res = await axios.get(url, { headers: { ...headers, Range: 'bytes=0-0' }, timeout: 12000, maxRedirects: 5, responseType: 'stream', validateStatus: () => true });
      res.data.destroy();
    } catch { res = null; }
  }
  const h = res?.headers || {};
  const ct = String(h['content-type'] || '').toLowerCase().split(';')[0];
  const range = String(h['content-range'] || '').match(/\/(\d+)$/);
  const size = range ? parseInt(range[1], 10) : parseInt(h['content-length'] || '0', 10);
  const dispo = String(h['content-disposition'] || '').match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  let type = ct.startsWith('video/') ? 'video' : ct.startsWith('audio/') ? 'audio' : ct.startsWith('image/') ? 'image' : null;
  if (!type) type = EXT.video.test(url) ? 'video' : EXT.audio.test(url) ? 'audio' : EXT.image.test(url) ? 'image' : 'file';
  if (/text\/html/.test(ct)) type = 'page';
  return { type, size: size || 0, mime: ct || 'application/octet-stream', name: dispo ? decodeURIComponent(dispo[1]) : null, ok: !!res && res.status < 400 };
}

const nameFromUrl = (u, fallback) => {
  try { const last = decodeURIComponent(new URL(u).pathname.split('/').filter(Boolean).pop() || ''); return last && /\.[a-z0-9]{2,5}$/i.test(last) ? last : fallback; } catch { return fallback; }
};

const findTitle = (r) => r?.title || r?.result?.title || r?.result?.name || r?.result?.filename || r?.result?.desc || r?.name || '';

async function sendOne(sock, msg, extra, item, caption) {
  const { url, type, size, mime, name } = item;
  const quoted = { quoted: msg };
  if (size > MAX_SEND) return extra.reply(`📎 File is too big for WhatsApp (${human(size)}). Direct link:\n${url}`);
  const tryUrl = async () => {
    if (type === 'video') return sock.sendMessage(extra.from, { video: { url }, mimetype: 'video/mp4', caption }, quoted);
    if (type === 'audio') return sock.sendMessage(extra.from, { audio: { url }, mimetype: mime.startsWith('audio/') ? mime : 'audio/mpeg', ptt: false }, quoted);
    if (type === 'image') return sock.sendMessage(extra.from, { image: { url }, caption }, quoted);
    return sock.sendMessage(extra.from, { document: { url }, mimetype: mime, fileName: name || nameFromUrl(url, 'file'), caption }, quoted);
  };
  try {
    await tryUrl();
  } catch (e) {
    // WA could not fetch the url itself -> download here (<=64MB) and send buffer
    if (size && size > 64 * 1024 * 1024) return extra.reply(`📎 ${caption || 'File'}\n${url}`);
    try {
      const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 120000, maxContentLength: MAX_SEND, headers: { 'User-Agent': UA } });
      const buf = Buffer.from(r.data);
      if (type === 'video') await sock.sendMessage(extra.from, { video: buf, mimetype: 'video/mp4', caption }, quoted);
      else if (type === 'audio') await sock.sendMessage(extra.from, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, quoted);
      else if (type === 'image') await sock.sendMessage(extra.from, { image: buf, caption }, quoted);
      else await sock.sendMessage(extra.from, { document: buf, mimetype: mime, fileName: name || nameFromUrl(url, 'file'), caption }, quoted);
    } catch (e2) {
      await extra.reply(`⚠️ Could not send the file. Direct link:\n${url}`);
    }
  }
}

/**
 * @param {object} o { name, aliases, label, endpoint, hosts:RegExp|null, example, emoji }
 */
function makeBtchCommand(o) {
  const processed = new Set();
  return {
    name: o.name,
    aliases: o.aliases || [],
    category: 'media',
    description: `Download from ${o.label}`,
    usage: `.${o.name} <${o.label} link>`,

    async execute(sock, msg, args, extra) {
      if (processed.has(msg.key.id)) return;
      processed.add(msg.key.id);
      setTimeout(() => processed.delete(msg.key.id), 5 * 60e3);

      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const text = args.join(' ') || quoted?.conversation || quoted?.extendedTextMessage?.text || '';
      const url = (text.match(/https?:\/\/[^\s]+/i) || [])[0];
      if (!url || (o.hosts && !o.hosts.test(url))) {
        return extra.reply(`${o.emoji || '⬇️'} *${o.label} Downloader*\n\nUsage: ${config.prefix}${o.name} <${o.label} link>\nExample: ${config.prefix}${o.name} ${o.example}`);
      }

      await extra.react('⏳');
      try {
        const r = await btch[o.endpoint](url);
        if (!r.status) {
          await extra.react('❌');
          return extra.reply(`❌ Could not download from ${o.label}: ${String(r.message || 'no result').slice(0, 120)}\n_The post may be private/deleted, or the download server is busy._`);
        }
        const urls = [...new Set(collectUrls(r))].filter((u) => u !== url);
        if (!urls.length) { await extra.react('❌'); return extra.reply(`❌ No downloadable media found on that ${o.label} link.`); }

        const items = [];
        for (const u of urls.slice(0, MAX_ITEMS + 4)) {
          const p = await probe(u);
          if (p.type === 'page' || !p.ok) continue;
          items.push({ url: u, ...p });
          if (items.length >= MAX_ITEMS) break;
        }
        if (!items.length) { await extra.react('❌'); return extra.reply(`❌ Found links but none were downloadable.\n${urls.slice(0, 3).join('\n')}`); }

        // prefer one video/audio over many near-duplicate qualities: keep all images, first of each other type
        const seen = new Set();
        const pick = items.filter((i) => { if (i.type === 'image') return true; if (seen.has(i.type)) return false; seen.add(i.type); return true; });

        const title = String(findTitle(r) || '').trim();
        for (let i = 0; i < pick.length; i++) {
          const parts = [`*DOWNLOADED BY ${config.botName.toUpperCase()}*`];
          if (i === 0 && title) parts.push(title.length > 300 ? title.slice(0, 297) + '...' : title);
          if (pick[i].size) parts.push(`📦 ${human(pick[i].size)}`);
          await sendOne(sock, msg, extra, pick[i], parts.join('\n'));
        }
        await extra.react('✅');
      } catch (e) {
        console.error(`[${o.name}]`, e.message);
        await extra.react('❌');
        await extra.reply(`❌ ${o.label} download failed: ${e.message}`);
      }
    }
  };
}

module.exports = { makeBtchCommand, probe };
