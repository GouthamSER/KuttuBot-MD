/**
 * Remove background via remove.bg API (needs REMOVEBG_API_KEY)
 */
const axios = require('axios');
const FormData = require('form-data');
const config = require('../../config');
const { getImageBuffer } = require('../../utils/quotedImage');

module.exports = {
  name: 'removebg',
  aliases: ['rmbg', 'nobg'],
  category: 'utility',
  description: 'Remove the background of an image',
  usage: '.removebg (send/reply to an image)',

  async execute(sock, msg, args, extra) {
    if (!config.removeBgApiKey) {
      return extra.reply('⚠️ Remove-BG is not set up.\nOwner: get a free key at remove.bg/api and set env var *REMOVEBG_API_KEY*.');
    }
    try {
      const img = await getImageBuffer(sock, msg, extra.from);
      if (!img) return extra.reply('🖼️ Send an image with *.removebg* as caption, or reply to an image with *.removebg*.');
      await extra.react('⏳');

      const form = new FormData();
      form.append('image_file', img.buffer, { filename: 'image.jpg' });
      form.append('size', 'auto');
      form.append('format', 'png');

      const res = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
        headers: { ...form.getHeaders(), 'X-Api-Key': config.removeBgApiKey },
        responseType: 'arraybuffer',
        timeout: 60000,
        maxBodyLength: Infinity,
        validateStatus: () => true
      });

      if (res.status !== 200) {
        let detail = '';
        try { detail = JSON.parse(Buffer.from(res.data).toString()).errors?.[0]?.title || ''; } catch {}
        await extra.react('❌');
        if (res.status === 402) return extra.reply('❌ Remove-BG credits finished for this API key.');
        if (res.status === 403) return extra.reply('❌ Remove-BG API key invalid.');
        return extra.reply(`❌ Remove-BG failed (${res.status}). ${detail}`);
      }

      // send as document so WhatsApp keeps the transparency
      await sock.sendMessage(extra.from, {
        document: Buffer.from(res.data),
        mimetype: 'image/png',
        fileName: 'no-background.png',
        caption: '✅ Background removed'
      }, { quoted: msg });
      await extra.react('✅');
    } catch (e) {
      console.error('[removebg]', e.message);
      await extra.react('❌');
      await extra.reply('❌ Remove-BG error: ' + e.message);
    }
  }
};
