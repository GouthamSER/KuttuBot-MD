/**
 * Sticker Creation Utilities
 * Rebuilt on ffmpeg + node-webpmux (already in package.json).
 * Old version required 'wa-sticker-formatter' which was never
 * added to package.json -> would crash on require(). Removed.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const webp = require('node-webpmux');
const sharp = require('sharp');
const config = require('../config');
const { getTempDir, deleteTempFile } = require('./tempManager');

const execPromise = (cmd) =>
  new Promise((resolve, reject) => exec(cmd, (err) => (err ? reject(err) : resolve())));

function buildFfmpegCmd({ input, output, isAnimated, cropSquare }) {
  const vf = cropSquare
    ? 'crop=min(iw\\,ih):min(iw\\,ih),scale=512:512' + (isAnimated ? ',fps=15' : '')
    : 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000' + (isAnimated ? ',fps=15' : '');

  return `"${ffmpegPath}" -y -i "${input}" -vf "${vf}" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${output}"`;
}

function writeExif(webpBuffer, { pack, author, categories }) {
  const json = {
    'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
    'sticker-pack-name': pack || config.packname || 'Made by',
    'sticker-pack-publisher': author || config.author || '',
    emojis: categories && categories.length ? categories : ['🤖']
  };
  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ]);
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const exif = Buffer.concat([exifAttr, jsonBuffer]);
  exif.writeUIntLE(jsonBuffer.length, 14, 4);
  return exif;
}

/**
 * Core: turn any image/video/gif buffer into a webp sticker buffer.
 * options: { pack, author, categories: [], isAnimated, cropSquare, quality }
 */
async function buildSticker(mediaBuffer, options = {}) {
  const tmpDir = getTempDir();
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const isAnimated = !!options.isAnimated;
  const tempInput = path.join(tmpDir, `stk_in_${stamp}${isAnimated ? '.mp4' : '.jpg'}`);
  const tempOutput = path.join(tmpDir, `stk_out_${stamp}.webp`);
  const tempFiles = [tempInput, tempOutput];

  try {
    fs.writeFileSync(tempInput, mediaBuffer);

    await execPromise(buildFfmpegCmd({
      input: tempInput,
      output: tempOutput,
      isAnimated,
      cropSquare: !!options.cropSquare
    }));

    let webpBuffer = fs.readFileSync(tempOutput);

    // If animated sticker came out too big, re-encode more aggressively (max 3 tries)
    let attempt = 0;
    while (isAnimated && webpBuffer.length > 1000 * 1024 && attempt < 3) {
      attempt++;
      const fallbackOutput = path.join(tmpDir, `stk_out_fb${attempt}_${stamp}.webp`);
      tempFiles.push(fallbackOutput);
      const fps = Math.max(6, 15 - attempt * 4);
      const quality = Math.max(25, 75 - attempt * 20);
      const duration = Math.max(1, 3 - attempt);
      const cmd = `"${ffmpegPath}" -y -i "${tempInput}" -t ${duration} -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=${fps},pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality ${quality} -compression_level 6 "${fallbackOutput}"`;
      await execPromise(cmd);
      if (fs.existsSync(fallbackOutput)) {
        webpBuffer = fs.readFileSync(fallbackOutput);
      }
    }

    const img = new webp.Image();
    await img.load(webpBuffer);
    img.exif = writeExif(webpBuffer, options);
    return await img.save(null);
  } catch (error) {
    throw new Error(`Sticker creation failed: ${error.message}`);
  } finally {
    tempFiles.forEach((f) => deleteTempFile(f));
  }
}

const createStickerBuffer = (media, options = {}) =>
  buildSticker(media, { ...options, cropSquare: false });

const createCroppedSticker = (media, options = {}) =>
  buildSticker(media, { ...options, cropSquare: true });

// No separate "circle" mode in ffmpeg pad path; mapped onto cropped square
// (WA renders square stickers, true circle needs a mask filter — kept simple/working).
const createCircleSticker = (media, options = {}) =>
  buildSticker(media, { ...options, cropSquare: true });

/**
 * Convert sticker webp back to a plain PNG image buffer.
 */
const stickerToImage = async (stickerBuffer) => {
  try {
    return await sharp(stickerBuffer).png().toBuffer();
  } catch (error) {
    throw new Error(`Sticker to image conversion failed: ${error.message}`);
  }
};

module.exports = {
  createStickerBuffer,
  createCroppedSticker,
  createCircleSticker,
  stickerToImage
};
