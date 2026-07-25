/**
 * Instagram Story Downloader - Using ruhend-scraper (igdl supports /stories/ links)
 */

const fs = require('fs');
const { igdl } = require('ruhend-scraper');
const axios = require('axios');
const config = require('../../config');
const { createTempFilePath, deleteTempFile } = require('../../utils/tempManager');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

function extractUniqueMedia(mediaData) {
  const uniqueMedia = [];
  const seenUrls = new Set();

  for (const media of mediaData) {
    if (!media.url) continue;
    if (!seenUrls.has(media.url)) {
      seenUrls.add(media.url);
      uniqueMedia.push(media);
    }
  }

  return uniqueMedia;
}

// Sniff magic bytes - reliable even if content-type header is missing/wrong
// (common on IG CDN, which often sends application/octet-stream for everything).
function sniffType(buffer) {
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') return 'video'; // mp4/mov
  if (buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return 'video'; // webm/mkv
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image'; // jpeg
  if (buffer.length >= 8 && buffer.toString('hex', 0, 8) === '89504e470d0a1a0a') return 'image'; // png
  if (buffer.length >= 6 && (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a')) return 'image'; // gif
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image'; // webp
  return null;
}

// Single GET, with IG-friendly headers (Referer/Origin), that:
// 1. gets the real bytes (no separate blocked-prone HEAD call)
// 2. figures out image vs video from content-type + magic-byte sniff (most reliable)
// 3. rejects HTML/blocked/garbage responses before we ever try to send them
async function fetchAndDetectMedia(mediaUrl) {
  const res = await axios.get(mediaUrl, {
    responseType: 'arraybuffer',
    timeout: 30000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 300,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://www.instagram.com/',
      'Origin': 'https://www.instagram.com',
      'Accept': '*/*'
    }
  });

  const buffer = Buffer.from(res.data);
  const contentType = (res.headers['content-type'] || '').toLowerCase();

  const looksHtml = buffer.length >= 10 &&
    /^<!doctype html|^<html/i.test(buffer.toString('utf8', 0, 100).trim());
  if (looksHtml) {
    throw new Error('blocked: got HTML page instead of media (IG CDN rejected request)');
  }
  if (buffer.length < 512) {
    throw new Error(`suspiciously small file: ${buffer.length} bytes`);
  }

  let mediaType = null;
  if (contentType.startsWith('video/')) mediaType = 'video';
  else if (contentType.startsWith('image/')) mediaType = 'image';
  else mediaType = sniffType(buffer); // header missing/generic -> check the actual bytes

  if (!mediaType) {
    throw new Error(`could not determine media type (content-type: ${contentType || 'none'})`);
  }

  return { buffer, mediaType };
}

module.exports = {
  name: 'story',
  aliases: ['igstory', 'storydl'],
  category: 'media',
  description: 'Download Instagram stories by username or story link',
  usage: '.story <username or story URL>',

  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra.from;

      if (processedMessages.has(msg.key.id)) {
        return;
      }
      processedMessages.add(msg.key.id);
      setTimeout(() => processedMessages.delete(msg.key.id), 5 * 60 * 1000);

      let text = msg.message?.conversation ||
                 msg.message?.extendedTextMessage?.text ||
                 args.join(' ');

      if (!text) {
        return extra.reply('Please provide an Instagram username or story link.\nUsage: .story <username or link>');
      }

      // strip the command word itself if present (e.g. ".story username")
      text = text.replace(/^[.!/]story\s*/i, '').trim();

      if (!text) {
        return extra.reply('Please provide an Instagram username or story link.\nUsage: .story <username or link>');
      }

      // Build a stories URL if a plain username was given instead of a link
      const isUrl = /^https?:\/\//i.test(text);
      const storyUrl = isUrl ? text : `https://www.instagram.com/stories/${text.replace('@', '').trim()}/`;

      if (!/instagram\.com\/stories\//i.test(storyUrl)) {
        return extra.reply('That does not look like a valid Instagram story link or username.');
      }

      await sock.sendMessage(chatId, {
        react: { text: '📥', key: msg.key }
      });

      const downloadData = await igdl(storyUrl).catch(() => null);

      if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
        return extra.reply('❌ No active stories found for this user, or the account is private.');
      }

      const mediaData = downloadData.data;
      const uniqueMedia = extractUniqueMedia(mediaData);
      const mediaToDownload = uniqueMedia.slice(0, 20);

      if (mediaToDownload.length === 0) {
        return extra.reply('❌ No valid story media found to download.');
      }

      for (let i = 0; i < mediaToDownload.length; i++) {
        let tempPath = null;
        try {
          const media = mediaToDownload[i];
          const mediaUrl = media.url;

          // Download + reliably detect image vs video in one shot
          const { buffer, mediaType } = await fetchAndDetectMedia(mediaUrl);
          const isVideo = mediaType === 'video';

          // Write to temp, send from temp, always clean up after (finally below)
          tempPath = createTempFilePath('story', isVideo ? 'mp4' : 'jpg');
          fs.writeFileSync(tempPath, buffer);

          if (isVideo) {
            await sock.sendMessage(chatId, {
              video: fs.readFileSync(tempPath),
              mimetype: 'video/mp4',
              caption: `*DOWNLOADED BY ${config.botName.toUpperCase()}*`
            }, { quoted: msg });
          } else {
            await sock.sendMessage(chatId, {
              image: fs.readFileSync(tempPath),
              caption: `*DOWNLOADED BY ${config.botName.toUpperCase()}*`
            }, { quoted: msg });
          }

          if (i < mediaToDownload.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (mediaError) {
          console.error(`Error downloading story item ${i + 1}:`, mediaError);
          await extra.reply(`⚠️ Item ${i + 1} failed: ${mediaError.message}`);
        } finally {
          if (tempPath) deleteTempFile(tempPath);
        }
      }
    } catch (error) {
      console.error('Error in story command:', error);
      await extra.reply('❌ An error occurred while processing the story request. Please try again.');
    }
  }
};
