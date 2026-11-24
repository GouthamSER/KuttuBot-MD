/**
 * Instagram Downloader - Using ruhend-scraper
 */

const APIs = require('../../utils/api');
const igdl = APIs.igdlWithKnight;
const axios = require('axios');
const fs = require('fs');
const { fetchMediaFile, detectMediaType } = require('../../utils/igMedia');
const config = require('../../config');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

// Caption: author + title (first item only) + slide counter for carousels
function buildCaption(meta, index, total) {
  const lines = [`*DOWNLOADED BY ${config.botName.toUpperCase()}*`];
  if (index === 0) {
    if (meta && meta.author) lines.push(`👤 @${String(meta.author).replace(/^@/, '')}`);
    if (meta && meta.title) {
      const t = String(meta.title).trim();
      if (t) lines.push(t.length > 300 ? t.slice(0, 297) + '...' : t);
    }
  }
  if (total > 1) lines.push(`📸 ${index + 1}/${total}`);
  return lines.join('\n');
}

// Function to extract unique media URLs with simple deduplication
function extractUniqueMedia(mediaData) {
  const uniqueMedia = [];
  const seenUrls = new Set();
  
  for (const media of mediaData) {
    if (!media.url || !isValidMediaUrl(media.url)) continue;
    
    // Only check for exact URL duplicates
    if (!seenUrls.has(media.url)) {
      seenUrls.add(media.url);
      uniqueMedia.push(media);
    }
  }
  
  return uniqueMedia;
}

// Function to validate media URL
function isValidMediaUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Accept any URL that looks like media
  try {
    const u = new URL(url);
    return /^https?:$/.test(u.protocol) && u.hostname.includes('.') && !/[&=?]/.test(u.hostname);
  } catch {
    return false;
  }
}

module.exports = {
  name: 'instagram',
  aliases: ['ig', 'insta', 'igdl', 'reels'],
  category: 'media',
  description: 'Download Instagram photos/videos/reels',
  usage: '<Instagram URL>',
  
  async execute(sock, msg, args, extra) {
    try {
      const chatId = extra.from;
      
      // Check if message has already been processed
      if (processedMessages.has(msg.key.id)) {
        return;
      }
      
      // Add message ID to processed set
      processedMessages.add(msg.key.id);
      
      // Clean up old message IDs after 5 minutes
      setTimeout(() => {
        processedMessages.delete(msg.key.id);
      }, 5 * 60 * 1000);
      
      const text = msg.message?.conversation || 
                   msg.message?.extendedTextMessage?.text ||
                   args.join(' ');
      
      if (!text) {
        return extra.reply('Please provide an Instagram link for the video.');
      }
      
      // Check for various Instagram URL formats
      const instagramPatterns = [
        /https?:\/\/(?:www\.)?instagram\.com\//,
        /https?:\/\/(?:www\.)?instagr\.am\//,
        /https?:\/\/(?:www\.)?instagram\.com\/p\//,
        /https?:\/\/(?:www\.)?instagram\.com\/reel\//,
        /https?:\/\/(?:www\.)?instagram\.com\/tv\//,
        /https?:\/\/(?:www\.)?instagram\.com\/stories\//
      ];
      
      const isValidUrl = instagramPatterns.some(pattern => pattern.test(text));
      
      if (!isValidUrl) {
        return extra.reply('That is not a valid Instagram link. Please provide a valid Instagram post, reel, or video link.');
      }
      
      const cleanUrl = APIs.cleanInstagramUrl(text);
      if (!cleanUrl) {
        return extra.reply('That is not a valid Instagram link. Please provide a valid Instagram post, reel, or video link.');
      }

      await sock.sendMessage(chatId, {
        react: { text: '📥', key: msg.key }
      });
      
      let downloadData;
      try {
        downloadData = await igdl(cleanUrl);
      } catch (e) {
        console.error('igdl failed:', e.message);
        const reasons = {
          RATE_LIMIT: '❌ Instagram download failed: download servers are rate-limited. Try again in a minute.',
          TIMEOUT: '❌ Instagram download failed: download servers timed out. Try again shortly.',
          NO_MEDIA: '❌ Could not get media. The post may be private, deleted, or Instagram is blocking the downloaders right now.'
        };
        return extra.reply(reasons[e.code] || '❌ Instagram download failed. Try again later.');
      }

      if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
        return extra.reply('❌ No media found at the provided link. The post might be private or the link is invalid.');
      }
      
      const mediaData = downloadData.data;
      
      // Simple deduplication - just remove exact URL duplicates
      const uniqueMedia = extractUniqueMedia(mediaData);
      
      // Limit to 10 unique media items (IG carousel max)
      const mediaToDownload = uniqueMedia.slice(0, 10); // carousel max 10 slides
      
      if (mediaToDownload.length === 0) {
        return extra.reply('❌ No valid media found to download. This might be a private post or the scraper failed.');
      }
      
      // Download all media silently without status messages
      for (let i = 0; i < mediaToDownload.length; i++) {
        let isVideo = false;
        let tmpFile = null;
        try {
          const media = mediaToDownload[i];
          const mediaUrl = media.url;
          
          // Ask the CDN what it actually is first; extension/type-field guessing is unreliable for stories
          const detectedType = await detectMediaType(mediaUrl);
          isVideo = detectedType
            ? detectedType === 'video'
            : (/\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) ||
               media.type === 'video' ||
               text.includes('/reel/') ||
               text.includes('/tv/'));
          
          if (isVideo) {
            // Stream direct URL to WA often fails for video (IG CDN blocks/timeouts on big fetch).
            // Pull + validate bytes ourselves first, then hand baileys a Buffer.
            tmpFile = await fetchMediaFile(mediaUrl, true);

            await sock.sendMessage(chatId, {
              video: { url: tmpFile },
              mimetype: 'video/mp4',
              caption: buildCaption(downloadData, i, mediaToDownload.length)
            }, { quoted: msg });
          } else {
            // Same deal for images: direct-URL stream gets blocked/blank by IG CDN too.
            tmpFile = await fetchMediaFile(mediaUrl, false);

            await sock.sendMessage(chatId, {
              image: { url: tmpFile },
              caption: buildCaption(downloadData, i, mediaToDownload.length)
            }, { quoted: msg });
          }
          
          // Add small delay between downloads to prevent rate limiting
          if (i < mediaToDownload.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (mediaError) {
          console.error(`Error downloading media ${i + 1}:`, mediaError);
          await extra.reply(`⚠️ Item ${i + 1} failed (${isVideo ? 'video' : 'image'}): ${mediaError.message}`);
        } finally {
          if (tmpFile) fs.promises.unlink(tmpFile).catch(() => {});
        }
      }
    } catch (error) {
      console.error('Error in Instagram command:', error);
      await extra.reply('❌ An error occurred while processing the Instagram request. Please try again.');
    }
  }
};
