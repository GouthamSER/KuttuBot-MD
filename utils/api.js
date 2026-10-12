/**
 * API Integration Utilities
 */

const axios = require('axios');
const config = require('../config');

const api = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
});


// ---------------------------------------------------------------------------
// Knight API - primary downloader. Every command tries this FIRST, then falls
// back to the older APIs/scrapers. Response: { success:true, result:{ download } }
// ---------------------------------------------------------------------------
const knightGet = async (path, params = {}) => {
  const res = await axios.get(`${config.knightApiBase}${path}`, {
    params: { apikey: config.knightApiKey, ...params },
    headers: {
      'X-API-Key': config.knightApiKey,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*'
    },
    timeout: 60000
  });
  const data = res.data;
  if (!data || data.success === false || !data.result) {
    throw new Error(`Knight API ${path} returned no result`);
  }
  return data.result;
};

// Pull every media url out of a Knight result (string, array, or nested fields)
const knightExtractMedia = (result) => {
  const out = [];
  const seen = new Set();
  const push = (u, type) => {
    if (typeof u !== 'string' || !/^https?:\/\//i.test(u) || seen.has(u)) return;
    seen.add(u);
    out.push({ url: u, type: type || (/\.(mp4|mov|webm|mkv)(\?|$)/i.test(u) ? 'video' : (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(u) ? 'image' : undefined)) });
  };
  const walk = (v, type) => {
    if (!v) return;
    if (typeof v === 'string') return push(v, type);
    if (Array.isArray(v)) return v.forEach(x => walk(x, type));
    if (typeof v === 'object') {
      const t = v.type === 'video' || v.type === 'image' ? v.type : type;
      const direct = v.download || v.url || v.link || v.video || v.image;
      if (direct) walk(direct, t);
    }
  };
  walk(result.download);
  if (!out.length) { walk(result.items); walk(result.medias); walk(result.media); walk(result.video); walk(result.url); }
  return out;
};

const knightMeta = (result) => ({
  title: result.title || result.caption || result.desc || '',
  thumbnail: result.thumbnail || result.thumb || result.cover || ''
});

// API Endpoints
const APIs = {
  knightGet,
  knightExtractMedia,

  // Image Generation
  generateImage: async (prompt) => {
    try {
      const response = await api.get(`https://api.siputzx.my.id/api/ai/stablediffusion`, {
        params: { prompt }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to generate image');
    }
  },
  
  // AI Chat - Shizo API
  chatAI: async (text) => {
    try {
      const response = await api.get(`https://api.shizo.top/ai/gpt?apikey=shizo&query=${encodeURIComponent(text)}`);
      if (response.data && response.data.msg) {
        return { msg: response.data.msg };
      }
      return response.data;
    } catch (error) {
      throw new Error('Failed to get AI response');
    }
  },
  
  // YouTube Download
  ytDownload: async (url, type = 'audio') => {
    try {
      const response = await api.get(`https://api.siputzx.my.id/api/d/ytmp3`, {
        params: { url }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to download YouTube video');
    }
  },
  
  // Instagram Download
  igDownload: async (url) => {
    try {
      const response = await api.get(`https://api.siputzx.my.id/api/d/igdl`, {
        params: { url }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to download Instagram content');
    }
  },
  
  // TikTok Download
  tiktokDownload: async (url) => {
    try {
      const response = await api.get(`https://api.siputzx.my.id/api/d/tiktok`, {
        params: { url }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to download TikTok video');
    }
  },
  
  // Translate
  translate: async (text, to = 'en') => {
    try {
      const response = await api.get(`https://api.siputzx.my.id/api/tools/translate`, {
        params: { text, to }
      });
      return response.data;
    } catch (error) {
      throw new Error('Translation failed');
    }
  },
  
  // Random Meme
  getMeme: async () => {
    try {
      const response = await api.get('https://meme-api.com/gimme');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch meme');
    }
  },
  
  // Random Quote
  getQuote: async () => {
    try {
      const response = await api.get('https://api.quotable.io/random');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch quote');
    }
  },
  
  // Random Joke
  getJoke: async () => {
    try {
      const response = await api.get('https://official-joke-api.appspot.com/random_joke');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch joke');
    }
  },
  
  // Weather
  getWeather: async (city) => {
    try {
      const response = await api.get(`https://api.siputzx.my.id/api/tools/weather`, {
        params: { city }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch weather');
    }
  },
  
  // Shorten URL
  shortenUrl: async (url) => {
    try {
      const response = await api.get(`https://tinyurl.com/api-create.php`, {
        params: { url }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to shorten URL');
    }
  },
  
  // Wikipedia Search
  wikiSearch: async (query) => {
    try {
      const response = await api.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw new Error('Wikipedia search failed');
    }
  },
  

  // ---- Knight API (primary) ----
  getKnightAudio: async (youtubeUrlOrQuery) => {
    const isUrl = /^https?:\/\//i.test(youtubeUrlOrQuery);
    const result = await knightGet('/api/download/ytaudio', {
      format: '128kbps',
      ...(isUrl ? { url: youtubeUrlOrQuery } : { query: youtubeUrlOrQuery })
    });
    const media = knightExtractMedia(result);
    if (!media.length) throw new Error('Knight ytaudio returned no download');
    return { download: media[0].url, ...knightMeta(result) };
  },

  getKnightVideo: async (youtubeUrlOrQuery, format = '720p') => {
    const isUrl = /^https?:\/\//i.test(youtubeUrlOrQuery);
    const result = await knightGet('/api/download/ytmp4', {
      format,
      ...(isUrl ? { url: youtubeUrlOrQuery } : { query: youtubeUrlOrQuery })
    });
    const media = knightExtractMedia(result);
    if (!media.length) throw new Error('Knight ytmp4 returned no download');
    return { download: media[0].url, ...knightMeta(result) };
  },

  // service: tiktok | instagram | facebook | pinterest | twitter
  // returns { media:[{url,type}], title, thumbnail }
  getKnightMedia: async (service, url) => {
    const result = await knightGet(`/api/download/${service}`, { url });
    const media = knightExtractMedia(result);
    if (!media.length) throw new Error(`Knight ${service} returned no download`);
    return { media, ...knightMeta(result) };
  },

  // Drop-in for ruhend igdl(): Knight first, then igdl. Returns { data:[{url,type}] }
  igdlWithKnight: async (url) => {
    try {
      const k = await APIs.getKnightMedia('instagram', url);
      return { data: k.media };
    } catch (e) {
      console.log('Knight instagram failed, falling back to igdl:', e.message);
    }
    return await require('ruhend-scraper').igdl(url);
  },

  // Song Download APIs
  getIzumiDownloadByUrl: async (youtubeUrl) => {
    const AXIOS_DEFAULTS = {
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    };
    
    const tryRequest = async (getter, attempts = 3) => {
      let lastError;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return await getter();
        } catch (err) {
          lastError = err;
          if (attempt < attempts) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
      }
      throw lastError;
    };
    
    const apiUrl = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.download) return res.data.result;
    throw new Error('Izumi youtube?url returned no download');
  },
  
  getIzumiDownloadByQuery: async (query) => {
    const AXIOS_DEFAULTS = {
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    };
    
    const tryRequest = async (getter, attempts = 3) => {
      let lastError;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return await getter();
        } catch (err) {
          lastError = err;
          if (attempt < attempts) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
      }
      throw lastError;
    };
    
    const apiUrl = `https://izumiiiiiiii.dpdns.org/downloader/youtube-play?query=${encodeURIComponent(query)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.download) return res.data.result;
    throw new Error('Izumi youtube-play returned no download');
  },
  
  getYupraDownloadByUrl: async (youtubeUrl) => {
    const AXIOS_DEFAULTS = {
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    };
    
    const tryRequest = async (getter, attempts = 3) => {
      let lastError;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return await getter();
        } catch (err) {
          lastError = err;
          if (attempt < attempts) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
      }
      throw lastError;
    };
    
    const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.success && res?.data?.data?.download_url) {
      return {
        download: res.data.data.download_url,
        title: res.data.data.title,
        thumbnail: res.data.data.thumbnail
      };
    }
    throw new Error('Yupra returned no download');
  },
  
  getOkatsuDownloadByUrl: async (youtubeUrl) => {
    const AXIOS_DEFAULTS = {
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    };
    
    const tryRequest = async (getter, attempts = 3) => {
      let lastError;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return await getter();
        } catch (err) {
          lastError = err;
          if (attempt < attempts) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
      }
      throw lastError;
    };
    
    const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.dl) {
      return {
        download: res.data.dl,
        title: res.data.title,
        thumbnail: res.data.thumb
      };
    }
    throw new Error('Okatsu ytmp3 returned no download');
  },
  
  getEliteProTechDownloadByUrl: async (youtubeUrl) => {
    const AXIOS_DEFAULTS = {
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    };
    
    const tryRequest = async (getter, attempts = 2) => {
      let lastError;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return await getter();
        } catch (err) {
          lastError = err;
          if (attempt < attempts) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
      }
      throw lastError;
    };
    
    // Primary endpoint: /download/ytmp3
    try {
      const apiUrl = `https://eliteprotech-apis.zone.id/download/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
      const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
      const download = res?.data?.download?.downloadUrl
        || res?.data?.download?.url
        || res?.data?.downloadURL
        || res?.data?.result?.url
        || res?.data?.url
        || (typeof res?.data?.download === 'string' ? res.data.download : null);

      if (download) {
        return {
          download,
          title: res?.data?.download?.title || res?.data?.result?.title || res?.data?.title || 'audio',
          thumbnail: res?.data?.download?.thumbnail || res?.data?.result?.thumbnail || res?.data?.thumbnail
        };
      }
    } catch (err) {
      // Fallback endpoint: /download/ytdown with format=mp3
      try {
        const fallbackUrl = `https://eliteprotech-apis.zone.id/download/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
        const res2 = await tryRequest(() => axios.get(fallbackUrl, AXIOS_DEFAULTS));
        const download = res2?.data?.download?.downloadUrl
          || res2?.data?.downloadURL
          || res2?.data?.result?.url
          || res2?.data?.url;
        if (download) {
          return {
            download,
            title: res2?.data?.download?.title || res2?.data?.title || 'audio',
            thumbnail: res2?.data?.download?.thumbnail || res2?.data?.thumbnail
          };
        }
      } catch (e2) {}
      throw err;
    }
    throw new Error('EliteProTech ytmp3 returned no download URL');
  },
  
  getEliteProTechVideoByUrl: async (youtubeUrl) => {
    const AXIOS_DEFAULTS = {
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    };
    
    const tryRequest = async (getter, attempts = 2) => {
      let lastError;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return await getter();
        } catch (err) {
          lastError = err;
          if (attempt < attempts) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
      }
      throw lastError;
    };
    
    // Primary endpoint: /download/ytmp4
    try {
      const apiUrl = `https://eliteprotech-apis.zone.id/download/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
      const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
      const download = res?.data?.result?.url
        || res?.data?.download?.downloadUrl
        || res?.data?.download?.url
        || res?.data?.downloadURL
        || res?.data?.url
        || (typeof res?.data?.result === 'string' ? res.data.result : null);

      if (download) {
        return {
          download,
          title: res?.data?.result?.title || res?.data?.download?.title || res?.data?.title || 'video',
          thumbnail: res?.data?.result?.thumbnail || res?.data?.download?.thumbnail || res?.data?.thumbnail
        };
      }
    } catch (err) {
      // Fallback endpoint: /download/ytdown with format=mp4
      try {
        const fallbackUrl = `https://eliteprotech-apis.zone.id/download/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp4`;
        const res2 = await tryRequest(() => axios.get(fallbackUrl, AXIOS_DEFAULTS));
        const download = res2?.data?.result?.url
          || res2?.data?.download?.downloadUrl
          || res2?.data?.downloadURL
          || res2?.data?.url;
        if (download) {
          return {
            download,
            title: res2?.data?.result?.title || res2?.data?.title || 'video',
            thumbnail: res2?.data?.result?.thumbnail || res2?.data?.thumbnail
          };
        }
      } catch (e2) {}
      throw err;
    }
    throw new Error('EliteProTech ytmp4 returned no download URL');
  },

  getRuhendDownloadByUrl: async (youtubeUrl) => {
    try {
      const ruhend = require('ruhend-scraper');
      const fn = ruhend.ytmp3 || ruhend.yta;
      if (typeof fn === 'function') {
        const res = await fn(youtubeUrl);
        const download = res?.audio || res?.download || res?.url || res?.link || (typeof res === 'string' ? res : null);
        if (download) {
          return {
            download,
            title: res?.title || ''
          };
        }
      }
    } catch (e) {
      // continue to throw
    }
    throw new Error('ruhend-scraper returned no audio download');
  },

  getRuhendVideoByUrl: async (youtubeUrl) => {
    try {
      const ruhend = require('ruhend-scraper');
      const fn = ruhend.ytmp4 || ruhend.ytv;
      if (typeof fn === 'function') {
        const res = await fn(youtubeUrl);
        const download = res?.video || res?.download || res?.url || res?.link || (typeof res === 'string' ? res : null);
        if (download) {
          return {
            download,
            title: res?.title || ''
          };
        }
      }
    } catch (e) {
      // continue to throw
    }
    throw new Error('ruhend-scraper returned no video download');
  },
  
  // Video Download APIs
  getYupraVideoByUrl: async (youtubeUrl) => {
    const AXIOS_DEFAULTS = {
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    };
    
    const tryRequest = async (getter, attempts = 3) => {
      let lastError;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return await getter();
        } catch (err) {
          lastError = err;
          if (attempt < attempts) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
      }
      throw lastError;
    };
    
    const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.success && res?.data?.data?.download_url) {
      return {
        download: res.data.data.download_url,
        title: res.data.data.title,
        thumbnail: res.data.data.thumbnail
      };
    }
    throw new Error('Yupra returned no download');
  },
  
  getOkatsuVideoByUrl: async (youtubeUrl) => {
    const AXIOS_DEFAULTS = {
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    };
    
    const tryRequest = async (getter, attempts = 3) => {
      let lastError;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return await getter();
        } catch (err) {
          lastError = err;
          if (attempt < attempts) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
      }
      throw lastError;
    };
    
    const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.mp4) {
      return { download: res.data.result.mp4, title: res.data.result.title };
    }
    throw new Error('Okatsu ytmp4 returned no mp4');
  },
  
  // TikTok Download API
  getTikTokDownload: async (url) => {
    try {
      const k = await APIs.getKnightMedia('tiktok', url);
      const vid = k.media.find(m => m.type !== 'image') || k.media[0];
      return { videoUrl: vid.url, title: k.title || 'TikTok Video' };
    } catch (e) {
      console.log('Knight tiktok failed, falling back to Siputzx:', e.message);
    }
    const apiUrl = `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`;
    try {
      const response = await axios.get(apiUrl, { 
        timeout: 15000,
        headers: {
          'accept': '*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.data && response.data.status && response.data.data) {
        let videoUrl = null;
        let title = null;
        
        if (response.data.data.urls && Array.isArray(response.data.data.urls) && response.data.data.urls.length > 0) {
          videoUrl = response.data.data.urls[0];
          title = response.data.data.metadata?.title || 'TikTok Video';
        } else if (response.data.data.video_url) {
          videoUrl = response.data.data.video_url;
          title = response.data.data.metadata?.title || 'TikTok Video';
        } else if (response.data.data.url) {
          videoUrl = response.data.data.url;
          title = response.data.data.metadata?.title || 'TikTok Video';
        } else if (response.data.data.download_url) {
          videoUrl = response.data.data.download_url;
          title = response.data.data.metadata?.title || 'TikTok Video';
        }
        
        return { videoUrl, title };
      }
      throw new Error('Invalid API response');
    } catch (error) {
      throw new Error('TikTok download failed');
    }
  },
  
  // Screenshot Website API
  screenshotWebsite: async (url) => {
    try {
      const apiUrl = `https://eliteprotech-apis.zone.id/tools/ssweb?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl, {
        timeout: 30000,
        responseType: 'arraybuffer',
        headers: {
          'accept': '*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      // Return the image buffer directly (API returns PNG binary)
      if (response.headers['content-type']?.includes('image')) {
        return Buffer.from(response.data);
      }
      
      // If API returns JSON with URL, try to parse it
      try {
        const data = JSON.parse(Buffer.from(response.data).toString());
        return data.url || data.data?.url || data.image || apiUrl;
      } catch (e) {
        // If not JSON, assume it's image data and return buffer
        return Buffer.from(response.data);
      }
    } catch (error) {
      throw new Error('Failed to take screenshot');
    }
  },
  
  // Text to Speech API
  textToSpeech: async (text, lang = 'en') => {
    // Primary: laurine.site custom TTS API
    try {
      const apiUrl = `https://www.laurine.site/api/tts/tts-nova?text=${encodeURIComponent(text)}`;
      const response = await axios.get(apiUrl, {
        timeout: 10000,
        headers: {
          'accept': '*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.data) {
        if (typeof response.data === 'string' && (response.data.startsWith('http://') || response.data.startsWith('https://'))) {
          return response.data;
        }
        if (response.data.data) {
          const data = response.data.data;
          if (data.URL) return data.URL;
          if (data.url) return data.url;
          if (data.MP3) return `https://ttsmp3.com/created_mp3_ai/${data.MP3}`;
          if (data.mp3) return `https://ttsmp3.com/created_mp3_ai/${data.mp3}`;
        }
        if (response.data.URL) return response.data.URL;
        if (response.data.url) return response.data.url;
        if (response.data.MP3) return `https://ttsmp3.com/created_mp3_ai/${response.data.MP3}`;
        if (response.data.mp3) return `https://ttsmp3.com/created_mp3_ai/${response.data.mp3}`;
      }
      throw new Error('Invalid API response structure');
    } catch (primaryError) {
      // Fallback: Google Translate TTS - no key needed, returns audio bytes directly,
      // so we can hand the URL straight back (caller downloads it exactly like before).
      // laurine.site went down (DNS failure in prod logs), don't let /tts die with it.
      const chunk = text.length > 200 ? text.slice(0, 200) : text;
      return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(chunk)}`;
    }
  }
};

module.exports = APIs;
