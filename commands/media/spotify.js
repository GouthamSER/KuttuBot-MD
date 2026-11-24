/**
 * Spotify - .spotify <track link>
 * Spotify audio is DRM-protected and can't be downloaded directly, so: read the track's
 * title/artist from the public page, then fetch the audio through the .song pipeline (YouTube).
 */
const axios = require('axios');
const songCmd = require('./song');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const TRACK_RE = /https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist|episode|artist)\/([A-Za-z0-9]+)/i;
const SHORT_RE = /https?:\/\/spotify\.link\/[A-Za-z0-9]+/i;

const decode = (s = '') => s
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
const og = (html, prop) => {
  const m = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']*)["']`, 'i'))
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${prop}["']`, 'i'));
  return m ? decode(m[1]) : '';
};

// og:title = track name; og:description = "Artist · Song · 2020" (artist first)
async function getTrackMeta(trackId) {
  const url = `https://open.spotify.com/track/${trackId}`;
  try {
    const { data } = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' } });
    const html = String(data);
    const title = og(html, 'og:title');
    const desc = og(html, 'og:description');
    const image = og(html, 'og:image');
    if (title) {
      const parts = desc.split('·').map((x) => x.trim()).filter(Boolean);
      const artist = parts.length > 1 ? parts[0] : '';
      return { title, artist, image };
    }
  } catch (e) { /* try next source */ }

  try { // official oEmbed: title + thumbnail, no artist
    const { data } = await axios.get('https://open.spotify.com/oembed', { params: { url }, timeout: 15000, headers: { 'User-Agent': UA } });
    if (data?.title) return { title: data.title, artist: '', image: data.thumbnail_url || '' };
  } catch (e) { /* none */ }

  try { // btch-downloader as last resort
    const r = await require('btch-downloader').spotify(url);
    const d = r?.result?.data || r?.result;
    if (d?.title) return { title: d.title, artist: d.artist || d.artists || '', image: d.thumbnail || d.cover || '' };
  } catch (e) { /* none */ }
  return null;
}

module.exports = {
  name: 'spotify',
  aliases: ['sp', 'spotifydl'],
  category: 'media',
  description: 'Download a Spotify track (matched on YouTube)',
  usage: '.spotify <Spotify track link>',

  async execute(sock, msg, args, extra) {
    const input = args.join(' ').trim();
    let link = (input.match(SHORT_RE) || [])[0];

    // resolve spotify.link short url
    if (link) {
      try {
        const r = await axios.get(link, { timeout: 15000, maxRedirects: 5, headers: { 'User-Agent': UA }, validateStatus: () => true });
        link = r.request?.res?.responseUrl || r.request?._redirectable?._currentUrl || link;
      } catch (e) { /* fall through to regex check */ }
    } else {
      link = input;
    }

    const m = String(link).match(TRACK_RE);
    if (!m) {
      return extra.reply('🎧 Send a Spotify track link.\n\n_Example: .spotify https://open.spotify.com/track/xxxx_');
    }
    if (m[1].toLowerCase() !== 'track') {
      return extra.reply(`❌ Only *track* links are supported (not ${m[1]}s). Send a single song link.`);
    }

    await extra.react('🔎');
    const meta = await getTrackMeta(m[2]);
    if (!meta) {
      await extra.react('❌');
      return extra.reply('❌ Could not read that track from Spotify. Check the link, or use *.song <name>*.');
    }

    const query = `${meta.artist ? meta.artist + ' ' : ''}${meta.title}`.trim();
    const info = `🎧 *${meta.title}*${meta.artist ? `\n👤 ${meta.artist}` : ''}\n\n_Searching audio..._`;
    try {
      if (meta.image) await sock.sendMessage(extra.from, { image: { url: meta.image }, caption: info }, { quoted: msg });
      else await extra.reply(info);
    } catch (e) {
      await extra.reply(info);
    }

    // hand over to the existing song downloader
    return songCmd.execute(sock, msg, query.split(/\s+/), extra);
  }
};
