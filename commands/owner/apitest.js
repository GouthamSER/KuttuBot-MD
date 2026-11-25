/**
 * .apitest - probe every downloader provider LIVE from this host (owner only)
 *   .apitest            -> YouTube audio + video + Instagram
 *   .apitest yt         -> YouTube only
 *   .apitest ig [url]   -> Instagram only (optionally with your own reel url)
 */
const axios = require('axios');
const providers = require('../../utils/providers');
const APIs = require('../../utils/api');

const YT_SAMPLE = 'https://youtu.be/dQw4w9WgXcQ';
const IG_SAMPLE = 'https://www.instagram.com/reel/De9ufYyJrgc/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms / 1000}s`)), ms))]);

// does the returned media link actually serve bytes?
async function linkOk(url) {
  try {
    const r = await axios.get(url, {
      timeout: 12000, responseType: 'stream', maxRedirects: 5, validateStatus: () => true,
      headers: { 'User-Agent': UA, Range: 'bytes=0-0', Referer: /savetube/i.test(url) ? 'https://savetube.me/' : 'https://www.instagram.com/' }
    });
    r.data.destroy();
    const ct = String(r.headers['content-type'] || '');
    if (r.status >= 400) return `link HTTP ${r.status}`;
    if (/text\/html/i.test(ct)) return 'link is a web page, not media';
    return null;
  } catch (e) {
    return `link ${e.code || e.message}`.slice(0, 40);
  }
}

async function probe(p, url, mediaUrlOf) {
  const t0 = Date.now();
  try {
    const v = await withTimeout(p.run(url), 30000);
    const first = mediaUrlOf(v);
    if (!first) return { name: p.name, ok: false, msg: 'no media url in result' };
    const bad = await linkOk(first);
    providers.reset(p.name);
    return { name: p.name, ok: !bad, warn: bad, ms: Date.now() - t0 };
  } catch (e) {
    return { name: p.name, ok: false, msg: `${e.response?.status ? 'HTTP ' + e.response.status + ' ' : ''}${e.message}`.slice(0, 50), ms: Date.now() - t0 };
  }
}

const fmt = (rows) => rows.map((r) => r.ok ? `✅ ${r.name} (${(r.ms / 1000).toFixed(1)}s)` : r.warn ? `⚠️ ${r.name} — url ok but ${r.warn}` : `❌ ${r.name} — ${r.msg}`).join('\n');

module.exports = {
  name: 'apitest',
  aliases: ['testapi', 'apicheck'],
  category: 'owner',
  description: 'Test all downloader APIs live from this host (owner only)',
  usage: '.apitest [yt|ig] [instagram url]',
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    if (!extra.isOwner) return extra.reply('❌ Owner only.');
    const mode = (args[0] || 'all').toLowerCase();
    const igUrl = args.find((a) => /instagram\.com/i.test(a)) ? APIs.cleanInstagramUrl(args.join(' ')) : IG_SAMPLE;
    await extra.reply('🧪 Testing providers live (about 30-60s)...');

    const jobs = [];
    if (mode === 'all' || mode === 'yt') {
      providers.REGISTRY.ytAudio.forEach((p) => jobs.push(['🎵 YT audio', probe(p, YT_SAMPLE, (v) => v?.download)]));
      providers.REGISTRY.ytVideo.forEach((p) => jobs.push(['🎬 YT video', probe(p, YT_SAMPLE, (v) => v?.download)]));
      jobs.push(['🎵 YT audio', probe({ name: 'knight-audio', run: () => APIs.getKnightAudio(YT_SAMPLE) }, YT_SAMPLE, (v) => v?.download)]);
    }
    if (mode === 'all' || mode === 'ig') {
      providers.REGISTRY.instagram.forEach((p) => jobs.push(['📸 Instagram', probe(p, igUrl, (v) => v?.data?.[0]?.url)]));
      jobs.push(['📸 Instagram', probe({ name: 'knight-ig', run: () => APIs.getKnightMedia('instagram', igUrl, 15000) }, igUrl, (v) => v?.media?.[0]?.url)]);
    }
    if (!jobs.length) return extra.reply('Usage: .apitest [yt|ig] [instagram url]');

    const done = await Promise.all(jobs.map(([, pr]) => pr));
    const groups = {};
    jobs.forEach(([g], i) => { (groups[g] = groups[g] || []).push(done[i]); });

    let out = '*API TEST*\n_(Instagram sample may be gone: pass your own reel link)_\n';
    for (const [g, rows] of Object.entries(groups)) {
      const okc = rows.filter((r) => r.ok).length;
      out += `\n*${g}* — ${okc}/${rows.length} working\n${fmt(rows)}\n`;
    }
    const cool = providers.status();
    if (cool.length) out += `\n⏸️ *Cooling down:* ${cool.map((c) => `${c.name} ${c.mins}m`).join(', ')}`;
    await extra.reply(out.trim());
  }
};
