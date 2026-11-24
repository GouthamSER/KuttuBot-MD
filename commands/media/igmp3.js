/**
 * IG Audio - extract the audio track from an Instagram reel/video as MP3
 * Triggers: .igmp3 | .igaudio | .reelmp3
 */

const fs = require('fs');
const APIs = require('../../utils/api');
const { toAudio } = require('../../utils/converter');
const { fetchMediaFile, detectMediaType } = require('../../utils/igMedia');
const config = require('../../config');

const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

module.exports = {
  name: 'igmp3',
  aliases: ['igaudio', 'reelmp3', 'igsong'],
  category: 'media',
  description: 'Download the audio (MP3) of an Instagram reel/video',
  usage: '.igmp3 <Instagram URL>',

  async execute(sock, msg, args, extra) {
    const chatId = extra.from;
    const text = args.join(' ') ||
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || '';

    const url = APIs.cleanInstagramUrl(text);
    if (!url) return extra.reply('🎵 Send an Instagram reel/video link.\n\n_Example: .igmp3 https://www.instagram.com/reel/xxxx/_');

    await extra.react('⏳');
    let tmpFile = null;
    try {
      let data;
      try {
        data = (await APIs.igdlWithKnight(url)).data;
      } catch (e) {
        await extra.react('❌');
        return extra.reply('❌ Could not fetch the reel. It may be private/deleted, or the download servers are busy. Try again later.');
      }

      // pick first item that is a video
      let videoUrl = null;
      for (const item of data) {
        const type = (await detectMediaType(item.url)) || item.type;
        if (type === 'video') { videoUrl = item.url; break; }
      }
      if (!videoUrl) {
        await extra.react('❌');
        return extra.reply('❌ No video found in that post (photos have no audio).');
      }

      tmpFile = await fetchMediaFile(videoUrl, true, MAX_VIDEO_BYTES);
      const mp3 = await toAudio(await fs.promises.readFile(tmpFile), 'mp4');
      if (!mp3 || !mp3.length) throw new Error('empty audio');

      await sock.sendMessage(chatId, {
        audio: mp3,
        mimetype: 'audio/mpeg',
        fileName: `${config.botName} - instagram.mp3`,
        ptt: false
      }, { quoted: msg });
      await extra.react('✅');
    } catch (err) {
      console.error('[igmp3]', err);
      await extra.react('❌');
      await extra.reply(`❌ Failed to extract audio: ${err.message}`);
    } finally {
      if (tmpFile) fs.promises.unlink(tmpFile).catch(() => {});
    }
  }
};
