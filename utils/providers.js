/**
 * Multi-provider downloader layer (YouTube audio/video, Instagram).
 *
 *  - Circuit breaker: a provider that fails with 402/429/404/DNS/timeout is skipped for a while,
 *    so one overloaded free API (e.g. Knight shared key -> 402) stops slowing every request.
 *  - Hedged requests: next provider starts if the current one is slow (HEDGE_MS), first success wins.
 *  - Real scrapers (no API key): Savetube, ytmp3.mobi (ymcdn), SaveIG-style Instagram sites.
 *  - Generic JSON endpoints (community REST APIs). Response shapes differ, so the media url is
 *    found by walking the JSON. Add your own without code via env vars:
 *        YT_AUDIO_APIS / YT_VIDEO_APIS / IG_APIS = JSON array of url templates, {url} is replaced:
 *        ["https://host/api/ytmp3?url={url}&apikey=XXX"]
 *
 * NOTE: free third-party endpoints come and go. Run `.apitest` (owner) to see what works from
 * YOUR host right now.
 */

const axios = require('axios');
const crypto = require('crypto');
const { btch } = require('./btch');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const HEDGE_MS = parseInt(process.env.PROVIDER_HEDGE_MS || '4000', 10);
const VIDEO_QUALITY = process.env.YT_VIDEO_QUALITY || '360';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Circuit breaker
// ---------------------------------------------------------------------------
const breaker = new Map(); // name -> { until, reason }

function classify(err) {
  const status = err?.response?.status;
  const msg = `${err?.code || ''} ${err?.message || ''}`;
  if (err?.noRetry) return 0; // "video not found" etc: provider is fine
  if (status === 402 || status === 429) return 10 * 60e3; // quota / rate limit
  if (status === 401 || status === 403) return 20 * 60e3; // key/blocked
  if (status === 404 || status === 410 || /ENOTFOUND|ECONNREFUSED|CERT|EAI_AGAIN/i.test(msg)) return 30 * 60e3; // dead
  if (/timeout|ECONNABORTED|ETIMEDOUT|ECONNRESET/i.test(msg) || status >= 500) return 2 * 60e3;
  return 60e3;
}

const isOpen = (name) => {
  const b = breaker.get(name);
  if (!b) return false;
  if (b.until <= Date.now()) { breaker.delete(name); return false; }
  return true;
};

function trip(name, err) {
  const ms = classify(err);
  if (!ms) return;
  breaker.set(name, { until: Date.now() + ms, reason: String(err?.response?.status || err?.code || err?.message || '').slice(0, 60) });
  console.log(`[providers] ${name} failed (${err?.response?.status || err?.message}); skipping for ${Math.round(ms / 60000)}m`);
}

const reset = (name) => breaker.delete(name);

/** wrap any async fn with the breaker. Throws {skipped:true} fast while open. */
async function guarded(name, fn) {
  if (isOpen(name)) {
    const e = new Error(`${name} skipped (cooling down: ${breaker.get(name).reason})`);
    e.skipped = true;
    throw e;
  }
  try {
    const r = await fn();
    reset(name);
    return r;
  } catch (e) {
    trip(name, e);
    throw e;
  }
}

function status() {
  const now = Date.now();
  return [...breaker.entries()].filter(([, b]) => b.until > now).map(([name, b]) => ({ name, mins: Math.ceil((b.until - now) / 60000), reason: b.reason }));
}

// ---------------------------------------------------------------------------
// Hedged runner: sequential order, but start the next provider if one is slow.
// providers: [{ name, run: async () => value }]
// ---------------------------------------------------------------------------
function hedged(label, providers, hedgeMs = HEDGE_MS) {
  let list = providers.filter((p) => !isOpen(p.name));
  if (!list.length) list = providers; // everything cooling down: try anyway

  return new Promise((resolve, reject) => {
    let next = 0;
    let running = 0;
    let finished = false;
    const errors = [];
    let timer = null;

    const fail = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      const err = new Error(`${label}: all providers failed`);
      err.errors = errors;
      err.noMedia = errors.length > 0 && errors.every((e) => e.noMedia);
      reject(err);
    };

    const launch = () => {
      if (finished) return;
      clearTimeout(timer);
      if (next >= list.length) {
        if (running === 0) fail();
        return;
      }
      const p = list[next++];
      running++;
      timer = setTimeout(launch, hedgeMs);
      Promise.resolve()
        .then(() => p.run())
        .then((value) => {
          if (!value) throw Object.assign(new Error('empty result'), { noRetry: true });
          reset(p.name);
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          resolve({ provider: p.name, value });
        })
        .catch((e) => {
          errors.push({ provider: p.name, message: e?.message || String(e), status: e?.response?.status, noMedia: !!e?.noRetry });
          trip(p.name, e);
          console.log(`[${label}] ${p.name} failed: ${e?.response?.status || ''} ${e?.message}`);
          running--;
          if (!finished) launch(); // move on immediately
        });
    };
    launch();
  });
}

// ---------------------------------------------------------------------------
// JSON walking helpers (for generic endpoints with unknown response shape)
// ---------------------------------------------------------------------------
const BAD_KEY = /thumb|cover|image|img|poster|avatar|icon|preview|banner|logo|author|channel/i;
const IMG_EXT = /\.(jpe?g|png|webp|gif|svg)(\?|$)/i;
const PREF = ['downloadUrl', 'download_url', 'downloadurl', 'download', 'dl', 'dlink', 'link', 'url', 'audio', 'mp3', 'video', 'mp4', 'result', 'data'];
const rank = (k) => { const i = PREF.findIndex((p) => p.toLowerCase() === k.toLowerCase()); return i === -1 ? 99 : i; };

function pickUrl(node, depth = 0) {
  if (node == null || depth > 6) return null;
  if (typeof node === 'string') return /^https?:\/\//i.test(node) && !IMG_EXT.test(node) ? node : null;
  if (Array.isArray(node)) {
    for (const x of node) { const r = pickUrl(x, depth + 1); if (r) return r; }
    return null;
  }
  if (typeof node === 'object') {
    const keys = Object.keys(node).filter((k) => !BAD_KEY.test(k)).sort((a, b) => rank(a) - rank(b));
    for (const k of keys) { const r = pickUrl(node[k], depth + 1); if (r) return r; }
  }
  return null;
}

function collectUrls(node, out = [], depth = 0) {
  if (node == null || depth > 6) return out;
  if (typeof node === 'string') { if (/^https?:\/\//i.test(node)) out.push(node); return out; }
  if (Array.isArray(node)) { node.forEach((x) => collectUrls(x, out, depth + 1)); return out; }
  if (typeof node === 'object') {
    for (const k of Object.keys(node)) if (!BAD_KEY.test(k)) collectUrls(node[k], out, depth + 1);
  }
  return out;
}

const pickTitle = (j) => j?.title || j?.result?.title || j?.data?.title || j?.result?.metadata?.title || j?.data?.metadata?.title || j?.metadata?.title || '';

function apiError(json, fallback = 'API returned no media') {
  const e = new Error((json && (json.message || json.error || json.msg)) ? String(json.message || json.error || json.msg).slice(0, 120) : fallback);
  e.noRetry = false;
  return e;
}

const getJson = async (url, timeout = 15000, headers = {}) => {
  const res = await axios.get(url, { timeout, headers: { 'User-Agent': UA, Accept: 'application/json,*/*', ...headers } });
  return res.data;
};

// ---------------------------------------------------------------------------
// YouTube helpers
// ---------------------------------------------------------------------------
const YT_ID = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|live\/)|music\.youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/;
const ytId = (url) => (String(url).match(YT_ID) || [])[1] || null;

// ---- Savetube (AES-128-CBC protocol, no key needed) ----
const SAVETUBE_KEY = Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex');
const SAVETUBE_HOSTS = ['media.savetube.vip', 'media.savetube.me'];
const stHeaders = { 'content-type': 'application/json', origin: 'https://yt.savetube.me', referer: 'https://yt.savetube.me/', 'user-agent': 'Mozilla/5.0 (Android 15; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0' };

function savetubeDecrypt(enc) {
  const raw = Buffer.from(enc, 'base64');
  const decipher = crypto.createDecipheriv('aes-128-cbc', SAVETUBE_KEY, raw.subarray(0, 16));
  return JSON.parse(Buffer.concat([decipher.update(raw.subarray(16)), decipher.final()]).toString());
}

async function savetube(url, format) {
  const id = ytId(url);
  if (!id) throw Object.assign(new Error('not a youtube url'), { noRetry: true });
  let cdn = null;
  let lastErr;
  for (const host of SAVETUBE_HOSTS) {
    try {
      const r = await axios.get(`https://${host}/api/random-cdn`, { headers: stHeaders, timeout: 10000 });
      if (r.data?.cdn) { cdn = r.data.cdn; break; }
    } catch (e) { lastErr = e; }
  }
  if (!cdn) throw lastErr || new Error('savetube: no cdn');

  const info = await axios.post(`https://${cdn}/v2/info`, { url: `https://www.youtube.com/watch?v=${id}` }, { headers: stHeaders, timeout: 15000 });
  if (!info.data?.data) throw apiError(info.data, 'savetube: no info');
  const dec = savetubeDecrypt(info.data.data);
  const isAudio = format === 'mp3';
  const dl = await axios.post(`https://${cdn}/download`, {
    id,
    downloadType: isAudio ? 'audio' : 'video',
    quality: isAudio ? '128' : String(format),
    key: dec.key
  }, { headers: stHeaders, timeout: 20000 });
  const link = dl.data?.data?.downloadUrl;
  if (!link) throw apiError(dl.data, 'savetube: no download url');
  return { download: link, title: dec.title || '', thumbnail: dec.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, duration: dec.duration };
}

// ---- ytmp3.mobi / ymcdn (init -> convert -> poll progress) ----
async function ymcdn(url, format) {
  const id = ytId(url);
  if (!id) throw Object.assign(new Error('not a youtube url'), { noRetry: true });
  const h = { 'User-Agent': UA, Referer: 'https://id.ytmp3.mobi/', Origin: 'https://id.ytmp3.mobi', Accept: '*/*' };
  const init = await axios.get(`https://d.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`, { headers: h, timeout: 12000 });
  const convertURL = init.data?.convertURL;
  if (!convertURL) throw apiError(init.data, 'ymcdn: no convertURL');
  const conv = await axios.get(`${convertURL}&v=${id}&f=${format}&_=${Math.random()}`, { headers: h, timeout: 20000 });
  const { downloadURL, progressURL, redirectURL } = conv.data || {};
  if (conv.data?.error && !downloadURL) throw apiError({ message: `ymcdn error ${conv.data.error}` });
  if (redirectURL && !downloadURL) {
    const r2 = await axios.get(redirectURL, { headers: h, timeout: 15000 });
    if (r2.data?.downloadURL) return { download: r2.data.downloadURL, title: r2.data.title || conv.data.title || '' };
  }
  if (!downloadURL) throw apiError(conv.data, 'ymcdn: no downloadURL');
  if (progressURL) {
    for (let i = 0; i < 25; i++) { // ~40s max
      const p = await axios.get(`${progressURL}&_=${Math.random()}`, { headers: h, timeout: 10000 });
      if (p.data?.error) throw apiError({ message: `ymcdn progress error ${p.data.error}` });
      if (Number(p.data?.progress) >= 3) return { download: downloadURL, title: p.data?.title || conv.data?.title || '' };
      await sleep(1600);
    }
    throw new Error('ymcdn: conversion timeout');
  }
  return { download: downloadURL, title: conv.data?.title || '' };
}

// ---- btch backend (hostinger-bot/btch-downloader endpoints) ----
async function btchYt(url, kind) {
  const r = await btch.youtube(url);
  if (!r.status) throw new Error(r.message || 'btch youtube failed');
  const link = kind === 'mp3' ? r.mp3 : r.mp4;
  if (!link || !/^https?:/.test(link)) throw new Error(`btch youtube: no ${kind} url`);
  return { download: link, title: r.title || '', thumbnail: r.thumbnail };
}

// ---- generic JSON endpoint factory ----
function genericYt(name, template, kind /* audio|video */) {
  return {
    name,
    run: async (url) => {
      const full = template.replace('{url}', encodeURIComponent(url)).replace('{q}', VIDEO_QUALITY);
      const j = await getJson(full, 20000);
      if (j && (j.status === false || j.success === false || j.ok === false)) throw apiError(j);
      const link = pickUrl(j);
      if (!link) throw apiError(j);
      return { download: link, title: pickTitle(j) };
    }
  };
}

function genericIg(name, template) {
  return {
    name,
    run: async (url) => {
      const j = await getJson(template.replace('{url}', encodeURIComponent(url)), 20000);
      if (j && (j.status === false || j.success === false || j.ok === false)) throw apiError(j);
      const urls = [...new Set(collectUrls(j))];
      if (!urls.length) throw apiError(j);
      return { data: urls.map((u) => ({ url: u })), title: pickTitle(j) };
    }
  };
}

const envList = (key) => {
  try { const v = JSON.parse(process.env[key] || '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.includes('{url}')) : []; } catch { return []; }
};

// Community REST endpoints. UNVERIFIED shapes -> breaker removes dead ones quickly.
const YT_AUDIO_ENDPOINTS = [
  ['ryzumi-mp3', 'https://api.ryzumi.vip/api/downloader/ytmp3?url={url}'],
  ['vreden-mp3', 'https://api.vreden.my.id/api/v1/download/youtube/audio?url={url}&quality=128'],
  ['deline-mp3', 'https://api.deline.web.id/downloader/ytmp3?url={url}'],
  ['nexray-mp3', 'https://api.nexray.web.id/downloader/ytmp3?url={url}'],
  ['zenzxz-mp3', 'https://api.zenzxz.my.id/api/downloader/ytmp3?url={url}'],
  ['nekolabs-mp3', 'https://api.nekolabs.web.id/downloader/youtube/v1?url={url}&format=mp3'],
  ['faa-mp3', 'https://www.api-faa.my.id/faa/ytmp3?url={url}']
];
const YT_VIDEO_ENDPOINTS = [
  ['ryzumi-mp4', 'https://api.ryzumi.vip/api/downloader/ytmp4?url={url}'],
  ['vreden-mp4', 'https://api.vreden.my.id/api/v1/download/youtube/video?url={url}&quality={q}'],
  ['deline-mp4', 'https://api.deline.web.id/downloader/ytmp4?url={url}'],
  ['nexray-mp4', 'https://api.nexray.web.id/downloader/ytmp4?url={url}'],
  ['zenzxz-mp4', 'https://api.zenzxz.my.id/api/downloader/ytmp4?url={url}'],
  ['nekolabs-mp4', 'https://api.nekolabs.web.id/downloader/youtube/v1?url={url}&format={q}'],
  ['faa-mp4', 'https://www.api-faa.my.id/faa/ytmp4?url={url}']
];
const IG_ENDPOINTS = [
  ['ryzumi-ig', 'https://api.ryzumi.vip/api/downloader/igdl?url={url}'],
  ['vreden-ig', 'https://api.vreden.my.id/api/v1/download/instagram?url={url}'],
  ['deline-ig', 'https://api.deline.web.id/downloader/instagram?url={url}'],
  ['nexray-ig', 'https://api.nexray.web.id/downloader/instagram?url={url}'],
  ['zenzxz-ig', 'https://api.zenzxz.my.id/api/downloader/instagram?url={url}'],
  ['nekolabs-ig', 'https://api.nekolabs.web.id/downloader/instagram?url={url}'],
  ['faa-ig', 'https://www.api-faa.my.id/faa/igdl?url={url}']
];

// ---------------------------------------------------------------------------
// Instagram: SaveIG-style "ajaxSearch" sites (HTML in JSON, no key)
// ---------------------------------------------------------------------------
const AJAX_HOSTS = [
  { name: 'saveig', base: 'https://v3.saveig.app', form: (u) => ({ q: u, t: 'media', lang: 'en' }) },
  { name: 'igdownloader', base: 'https://v3.igdownloader.app', form: (u) => ({ recaptchaToken: '', q: u, t: 'media', lang: 'en' }) },
  { name: 'yt1s-io', base: 'https://yt1s.io', form: (u) => ({ p: 'home', q: u, w: '', lang: 'en' }) }
];

function parseAjaxHtml(html) {
  const out = [];
  const seen = new Set();
  const re = /<a\b[^>]*?href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = m[1].replace(/&amp;/g, '&');
    const text = m[2].replace(/<[^>]+>/g, ' ').toLowerCase();
    const tag = m[0].toLowerCase();
    const isDownload = /download-items__btn|abutton|btn-premium|download/.test(tag) || /download/.test(text);
    if (!isDownload) continue;
    if (/saveig\.|igdownloader\.|yt1s\.io|play\.google|apps\.apple|facebook\.com|twitter\.com|t\.me\//i.test(href) && !/[?&](token|file|dl)=/.test(href)) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    const type = /photo|image|jpg|jpeg|png|webp/.test(text) ? 'image' : /video|mp4/.test(text) ? 'video' : undefined;
    out.push({ url: href, type });
  }
  return out;
}

function ajaxProvider(h) {
  return {
    name: `ajax-${h.name}`,
    run: async (url) => {
      const body = new URLSearchParams(h.form(url)).toString();
      const res = await axios.post(`${h.base}/api/ajaxSearch`, body, {
        timeout: 20000,
        headers: {
          'User-Agent': UA,
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Accept: '*/*',
          Origin: h.base,
          Referer: `${h.base}/`,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      const d = res.data;
      if (!d || d.status !== 'ok' || typeof d.data !== 'string') throw apiError(d, `${h.name}: bad response`);
      const media = parseAjaxHtml(d.data);
      if (!media.length) throw Object.assign(new Error(`${h.name}: no links (private/deleted post?)`), { noRetry: false });
      return { data: media };
    }
  };
}

// ---------------------------------------------------------------------------
// Public registries (also used by `.apitest`)
// ---------------------------------------------------------------------------
const mk = (list, fn, kind) => list.map(([name, tpl]) => fn(name, tpl, kind));

function buildAudio() {
  return [
    { name: 'savetube-mp3', run: (u) => savetube(u, 'mp3') },
    { name: 'ymcdn-mp3', run: (u) => ymcdn(u, 'mp3') },
    { name: 'btch-yt-mp3', run: async (u) => btchYt(u, 'mp3') },
    ...mk(YT_AUDIO_ENDPOINTS, genericYt, 'audio'),
    ...envList('YT_AUDIO_APIS').map((t, i) => genericYt(`custom-audio-${i + 1}`, t, 'audio'))
  ];
}
function buildVideo() {
  return [
    { name: 'savetube-mp4', run: (u) => savetube(u, VIDEO_QUALITY) },
    { name: 'ymcdn-mp4', run: (u) => ymcdn(u, 'mp4') },
    { name: 'btch-yt-mp4', run: async (u) => btchYt(u, 'mp4') },
    ...mk(YT_VIDEO_ENDPOINTS, genericYt, 'video'),
    ...envList('YT_VIDEO_APIS').map((t, i) => genericYt(`custom-video-${i + 1}`, t, 'video'))
  ];
}
function buildInstagram() {
  return [
    ...AJAX_HOSTS.map(ajaxProvider),
    { name: 'btch-ig', run: async (u) => { const r = await btch.igdl(u); if (!r.status || !r.result?.length) throw new Error(r.message || 'btch igdl: no media'); return { data: r.result.filter((x) => x.url).map((x) => ({ url: x.url })) }; } },
    ...mk(IG_ENDPOINTS, (n, t) => genericIg(n, t)),
    ...envList('IG_APIS').map((t, i) => genericIg(`custom-ig-${i + 1}`, t))
  ];
}

const REGISTRY = {
  ytAudio: buildAudio(),
  ytVideo: buildVideo(),
  instagram: buildInstagram()
};

const bind = (label, list, url) => list.map((p) => ({ name: p.name, run: () => p.run(url) }));

/** -> { download, title, thumbnail? }  (throws if all fail) */
async function ytAudio(url) {
  const { provider, value } = await hedged('ytAudio', bind('ytAudio', REGISTRY.ytAudio, url));
  console.log(`[ytAudio] OK via ${provider}`);
  return { ...value, provider };
}
async function ytVideo(url) {
  const { provider, value } = await hedged('ytVideo', bind('ytVideo', REGISTRY.ytVideo, url));
  console.log(`[ytVideo] OK via ${provider}`);
  return { ...value, provider };
}
/** -> { data:[{url,type?}], title? } */
async function instagram(url) {
  const { provider, value } = await hedged('instagram', bind('instagram', REGISTRY.instagram, url));
  console.log(`[instagram] OK via ${provider}`);
  return { ...value, provider };
}

module.exports = { ytAudio, ytVideo, instagram, guarded, hedged, status, reset, isOpen, REGISTRY, ytId, pickUrl, collectUrls, parseAjaxHtml, savetubeDecrypt };
