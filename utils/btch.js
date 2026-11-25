/**
 * btch client: every endpoint of https://github.com/hostinger-bot/btch-downloader
 * without installing the npm package (it drags ~100MB of build tools into node_modules).
 *
 * Same backend + request format as the package (GET {base}/{endpoint}?url=...).
 * Every function returns the normalized shape of the package:
 *   { status:true, ...fields }  or  { status:false, message }   (never throws)
 *
 * Endpoints: ttdl igdl twitter youtube fbdown mediafire capcut gdrive pinterest aio
 *            xiaohongshu xiaohongshuProfile douyin snackvideo cocofun spotify yts
 *            soundcloud threads kuaishou
 */

const axios = require('axios');

const VERSION = '6.4.0';
const BASE = () => String(process.env.BTCH_BASE || 'https://backend1.tioo.eu.org').replace(/\/+$/, '');
const TIMEOUT = parseInt(process.env.BTCH_TIMEOUT || '60000', 10);

/** raw GET -> parsed JSON (throws on HTTP error / bad JSON) */
async function btchGet(endpoint, input, timeout = TIMEOUT) {
  const res = await axios.get(`${BASE()}/${endpoint}`, {
    params: { url: input },
    timeout,
    headers: { 'Content-Type': 'application/json', 'User-Agent': `btch/${VERSION}`, 'X-Client-Version': VERSION }
  });
  return res.data;
}

const fail = (e) => ({ status: false, message: e instanceof Error ? e.message : String(e || 'Unknown error') });

/** wrap: run endpoint, map data -> result object */
const run = (endpoint, map, opts = {}) => async (input) => {
  try {
    const data = await btchGet(endpoint, input, opts.timeout);
    if (opts.check) { const msg = opts.check(data); if (msg) return fail(new Error(msg)); }
    return { status: true, ...map(data) };
  } catch (e) {
    return fail(e);
  }
};

const btch = {
  ttdl: run('ttdl', (d) => ({
    title: d?.title, title_audio: d?.title_audio, thumbnail: d?.thumbnail, video: d?.video ?? [], audio: d?.audio ?? []
  })),

  igdl: run('igdl', (d) => ({
    result: (Array.isArray(d) ? d : []).map((i) => ({ thumbnail: i?.thumbnail || '', url: i?.url || '' }))
  }), { check: (d) => (!d || !d.length ? 'No results found' : null) }),

  twitter: run('twitter', (d) => ({ title: d?.title, url: d?.url })),

  youtube: run('youtube', (d) => ({
    title: d?.title, thumbnail: d?.thumbnail, author: d?.author, mp3: d?.mp3, mp4: d?.mp4
  })),

  fbdown: run('fbdown', (d) => ({ Normal_video: d?.Normal_video, HD: d?.HD })),

  mediafire: run('mediafire', (d) => ({ result: d })),
  capcut: run('capcut', (d) => ({ ...d })),
  aio: run('aio', (d) => ({ ...d })),
  gdrive: run('gdrive', (d) => ({ result: d })),
  pinterest: run('pinterest', (d) => ({ result: d })), // input = search query or url

  xiaohongshu: run('rednote', (d) => ({ result: d?.result || d }), {
    check: (d) => { const a = d?.result || d; return !a || (!a.noteId && !a.notes) ? 'No results found' : null; }
  }),
  xiaohongshuProfile: run('rednote-profile', (d) => ({ result: d?.result || d }), {
    check: (d) => { const a = d?.result || d; return !a || (!a.user && !a.stats) ? 'No results found' : null; }
  }),

  douyin: run('douyin', (d) => ({ result: d })),
  snackvideo: run('snackvideo', (d) => ({ result: d })),
  cocofun: run('cocofun', (d) => ({ result: d })),

  spotify: run('spotify', (d) => {
    const r = d?.res_data ? { ...d.res_data } : d;
    if (r) { delete r.message; if (r.server === 'rapidapi') delete r.server; }
    return { result: r };
  }),

  yts: run('yts', (d) => ({ result: d })), // input = search query

  soundcloud: run('soundcloud', (d) => ({ result: d })),
  threads: run('threads', (d) => ({ result: d })),

  kuaishou: run('kuaishou', (d) => ({ result: d }), {
    check: (d) => (!d || !d.success ? 'No results found or failed to fetch' : null)
  })
};

module.exports = { btch, btchGet, VERSION };
