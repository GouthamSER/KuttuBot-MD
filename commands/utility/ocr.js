/**
 * OCR - read text from an image (ocr.space)
 */
const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');
const config = require('../../config');
const { getImageBuffer } = require('../../utils/quotedImage');

module.exports = {
  name: 'ocr',
  aliases: ['imgtext', 'readtext', 'totext'],
  category: 'utility',
  description: 'Extract text from an image',
  usage: '.ocr [lang: eng|mal|tam|hin|...] (send/reply to an image)',

  async execute(sock, msg, args, extra) {
    try {
      const img = await getImageBuffer(sock, msg, extra.from);
      if (!img) return extra.reply('🖼️ Send an image with *.ocr* as caption, or reply to an image with *.ocr*.\n_Optional language code: .ocr mal_');
      await extra.react('⏳');

      // ocr.space free tier: max 1MB -> shrink to JPEG
      const small = await sharp(img.buffer).rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();

      const lang = (args[0] || 'eng').toLowerCase().replace(/[^a-z]/g, '').slice(0, 3) || 'eng';
      const form = new FormData();
      form.append('apikey', config.ocrSpaceApiKey || 'helloworld');
      form.append('language', lang);
      form.append('OCREngine', '2');
      form.append('isOverlayRequired', 'false');
      form.append('file', small, { filename: 'image.jpg', contentType: 'image/jpeg' });

      const res = await axios.post('https://api.ocr.space/parse/image', form, {
        headers: form.getHeaders(), timeout: 45000, maxBodyLength: Infinity
      });
      const d = res.data;
      if (d?.IsErroredOnProcessing) {
        await extra.react('❌');
        const m = Array.isArray(d.ErrorMessage) ? d.ErrorMessage.join(' ') : d.ErrorMessage;
        return extra.reply(`❌ OCR failed: ${m || 'unknown error'}\n_If the language is wrong, try .ocr eng_`);
      }
      const text = (d?.ParsedResults || []).map((r) => r.ParsedText || '').join('\n').trim();
      if (!text) { await extra.react('❌'); return extra.reply('❌ No text found in that image.'); }

      await extra.reply(`📝 *Extracted text*\n\n${text.slice(0, 3500)}`);
      await extra.react('✅');
    } catch (e) {
      console.error('[ocr]', e.message);
      await extra.react('❌');
      await extra.reply('❌ OCR error: ' + (e.response?.status === 403 || e.response?.status === 429 ? 'OCR service rate-limited, try later (owner can set OCRSPACE_API_KEY).' : e.message));
    }
  }
};
