/**
 * YouTube search via btch backend: .yts <query>
 * Result shape is not documented, so fields are read defensively.
 */
const config = require('../../config');
const { btch } = require('../../utils/btch');

const first = (o, keys) => { for (const k of keys) if (o && o[k] != null && o[k] !== '') return o[k]; return ''; };

module.exports = {
  name: 'yts',
  aliases: ['ytsearch', 'youtubesearch', 'ytfind'],
  category: 'media',
  description: 'Search YouTube videos',
  usage: '.yts <query>',

  async execute(sock, msg, args, extra) {
    const q = args.join(' ').trim();
    if (!q) return extra.reply(`🔎 Usage: ${config.prefix}yts <search text>\nExample: ${config.prefix}yts arijit singh live`);
    await extra.react('🔎');
    const r = await btch.yts(q);
    if (!r.status) { await extra.react('❌'); return extra.reply(`❌ Search failed: ${String(r.message).slice(0, 100)}`); }

    const d = r.result;
    const list = (Array.isArray(d) ? d : d?.videos || d?.result || d?.data || d?.items || []).filter((x) => x && typeof x === 'object');
    if (!list.length) { await extra.react('❌'); return extra.reply('❌ No results found.'); }

    const lines = list.slice(0, 8).map((v, i) => {
      const title = first(v, ['title', 'name']);
      const link = first(v, ['url', 'link', 'videoUrl']) || (v.id || v.videoId ? `https://youtu.be/${v.id || v.videoId}` : '');
      const dur = first(v, ['duration', 'timestamp', 'length']);
      const who = first(v, ['author', 'channel', 'channelTitle', 'uploader']);
      const by = typeof who === 'object' ? (who.name || who.title || '') : who;
      return `*${i + 1}.* ${title}${dur ? ` _(${typeof dur === 'object' ? (dur.timestamp || dur.text || '') : dur})_` : ''}${by ? `\n   👤 ${by}` : ''}${link ? `\n   ${link}` : ''}`;
    });
    await extra.reply(`🔎 *YouTube results for:* ${q}\n\n${lines.join('\n\n')}\n\n_Download: ${config.prefix}song <name or link> / ${config.prefix}ytvideo <link>_`);
    await extra.react('✅');
  }
};
