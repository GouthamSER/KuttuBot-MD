/**
 * Upscale - 2x enlarge + sharpen an image locally (sharp, no API)
 * Note: classic Lanczos resize, NOT AI super-resolution.
 */
const sharp = require('sharp');
const { getImageBuffer } = require('../../utils/quotedImage');

const MAX_SIDE = 4096;

module.exports = {
  name: 'upscale',
  aliases: ['enhance', 'hd', 'enlarge'],
  category: 'utility',
  description: 'Enlarge an image 2x and sharpen it',
  usage: '.upscale (send/reply to an image)',

  async execute(sock, msg, args, extra) {
    try {
      const img = await getImageBuffer(sock, msg, extra.from);
      if (!img) return extra.reply('🖼️ Send an image with *.upscale* as caption, or reply to an image with *.upscale*.');
      await extra.react('⏳');

      const meta = await sharp(img.buffer).metadata();
      if (!meta.width || !meta.height) return extra.reply('❌ Could not read that image.');
      const factor = Math.min(2, MAX_SIDE / Math.max(meta.width, meta.height));
      if (factor <= 1.05) return extra.reply('ℹ️ Image is already very large, nothing to upscale.');

      const out = await sharp(img.buffer)
        .rotate()
        .resize(Math.round(meta.width * factor), Math.round(meta.height * factor), { kernel: 'lanczos3' })
        .sharpen({ sigma: 1 })
        .jpeg({ quality: 92 })
        .toBuffer();

      await sock.sendMessage(extra.from, { image: out, caption: `✨ Upscaled ${meta.width}x${meta.height} → ${Math.round(meta.width * factor)}x${Math.round(meta.height * factor)}` }, { quoted: msg });
      await extra.react('✅');
    } catch (e) {
      console.error('[upscale]', e);
      await extra.react('❌');
      await extra.reply('❌ Upscale failed: ' + e.message);
    }
  }
};
