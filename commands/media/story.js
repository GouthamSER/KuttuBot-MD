/**
 * Instagram Story Downloader - Using ruhend-scraper (igdl supports /stories/ links)
 */

const { igdl } = require('ruhend-scraper');
const config = require('../../config');

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

// IG CDN urls have no file extension, so extension/type-field guessing is unreliable.
// Ask the CDN directly what it is.
async function detectMediaType(mediaUrl) {
  try {
    const res = await fetch(mediaUrl, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.startsWith('video/')) return 'video';
    if (contentType.startsWith('image/')) return 'image';
  } catch (e) {
    // HEAD blocked/failed, fall through to extension guess below
  }
  return null;
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
        let isVideo = false;
        try {
          const media = mediaToDownload[i];
          const mediaUrl = media.url;

          // Ask the CDN what it actually is first; extension/type-field guessing is unreliable for stories
          const detectedType = await detectMediaType(mediaUrl);
          isVideo = detectedType
            ? detectedType === 'video'
            : (/\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) || media.type === 'video');

          if (isVideo) {
            // Stream direct URL to WA often fails for video (IG CDN blocks/timeouts on big fetch).
            // Pull bytes ourselves first, then hand baileys a Buffer.
            const vRes = await fetch(mediaUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            if (!vRes.ok) throw new Error(`video fetch failed: HTTP ${vRes.status}`);
            const vBuf = Buffer.from(await vRes.arrayBuffer());

            await sock.sendMessage(chatId, {
              video: vBuf,
              mimetype: 'video/mp4',
              caption: `*DOWNLOADED BY ${config.botName.toUpperCase()}*`
            }, { quoted: msg });
          } else {
            await sock.sendMessage(chatId, {
              image: { url: mediaUrl },
              caption: `*DOWNLOADED BY ${config.botName.toUpperCase()}*`
            }, { quoted: msg });
          }

          if (i < mediaToDownload.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (mediaError) {
          console.error(`Error downloading story item ${i + 1}:`, mediaError);
          await extra.reply(`⚠️ Item ${i + 1} failed (${isVideo ? 'video' : 'image'}): ${mediaError.message}`);
        }
      }
    } catch (error) {
      console.error('Error in story command:', error);
      await extra.reply('❌ An error occurred while processing the story request. Please try again.');
    }
  }
};
