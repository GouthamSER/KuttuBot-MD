/**
 * Instagram Downloader - Using ruhend-scraper
 */

const { igdl } = require('ruhend-scraper');
const axios = require('axios');
const config = require('../../config');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

// Plain fetch to IG CDN often gets blocked (returns HTML login/error page instead
// of video bytes) unless Referer/Origin look like a real IG page request.
// Validate we actually got video bytes before handing to WA, or it shows
// "wrong file"/can't-open errors.
async function fetchVideoBuffer(mediaUrl) {
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
      'Accept': 'video/mp4,video/*,*/*;q=0.8'
    }
  });

  const buffer = Buffer.from(res.data);
  const contentType = (res.headers['content-type'] || '').toLowerCase();

  const looksHtml = buffer.length >= 10 &&
    /^<!doctype html|^<html/i.test(buffer.toString('utf8', 0, 100).trim());

  if (looksHtml) {
    throw new Error('blocked: got HTML page instead of video (IG CDN rejected request)');
  }
  if (contentType && !contentType.startsWith('video/') && contentType !== 'application/octet-stream') {
    throw new Error(`unexpected content-type: ${contentType}`);
  }
  if (buffer.length < 1024) {
    throw new Error(`suspiciously small file: ${buffer.length} bytes`);
  }

  return buffer;
}

// Function to extract unique media URLs with simple deduplication
function extractUniqueMedia(mediaData) {
  const uniqueMedia = [];
  const seenUrls = new Set();
  
  for (const media of mediaData) {
    if (!media.url) continue;
    
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
  return url.includes('cdninstagram.com') || 
         url.includes('instagram') || 
         url.includes('http');
}

// IG CDN urls have no file extension, so extension/type-field guessing alone is unreliable
// (especially for story links). Ask the CDN directly what it is.
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
      
      await sock.sendMessage(chatId, {
        react: { text: '📥', key: msg.key }
      });
      
      const downloadData = await igdl(text);
      
      if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
        return extra.reply('❌ No media found at the provided link. The post might be private or the link is invalid.');
      }
      
      const mediaData = downloadData.data;
      
      // Simple deduplication - just remove exact URL duplicates
      const uniqueMedia = extractUniqueMedia(mediaData);
      
      // Limit to maximum 20 unique media items
      const mediaToDownload = uniqueMedia.slice(0, 20);
      
      if (mediaToDownload.length === 0) {
        return extra.reply('❌ No valid media found to download. This might be a private post or the scraper failed.');
      }
      
      // Download all media silently without status messages
      for (let i = 0; i < mediaToDownload.length; i++) {
        let isVideo = false;
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
            const vBuf = await fetchVideoBuffer(mediaUrl);

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
          
          // Add small delay between downloads to prevent rate limiting
          if (i < mediaToDownload.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (mediaError) {
          console.error(`Error downloading media ${i + 1}:`, mediaError);
          await extra.reply(`⚠️ Item ${i + 1} failed (${isVideo ? 'video' : 'image'}): ${mediaError.message}`);
        }
      }
    } catch (error) {
      console.error('Error in Instagram command:', error);
      await extra.reply('❌ An error occurred while processing the Instagram request. Please try again.');
    }
  }
};
