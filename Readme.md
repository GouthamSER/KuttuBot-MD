<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00c6ff,100:0072ff&height=200&section=header&text=KuttuBot%20MD&fontSize=48&fontColor=ffffff&fontAlignY=38&desc=WhatsApp%20MD%20Bot%20powered%20by%20Baileys&descAlignY=58&descFontColor=ffffffcc" />

<br/>

[![Version](https://img.shields.io/badge/Version-2.0.0-ff4081?style=for-the-badge)](#-whats-new-in-v200)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Baileys](https://img.shields.io/badge/Baileys-v7-00bcd4?style=for-the-badge)](https://github.com/WhiskeySockets/Baileys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-✓-brightgreen?style=for-the-badge)](https://github.com/GouthamSER/KuttuBot-mini-MD)

<br/>

<img src="utils/bot_image.jpg" alt="KuttuBot MD" width="240"/>

<br/>
<br/>

> **Fast · Lightweight · Fully Customizable**  
> A modular WhatsApp MD bot — fork it, brand it, ship it. Free forever.

<br/>

</div>

---

## 📦 Command Stats

| Category | Commands |
|:--------:|:--------:|
| 🛡️ Admin | 21 |
| 🤖 AI | 3 |
| 🌸 Anime | 9 |
| 🎉 Fun | 16 |
| ⚙️ General | 21 |
| 🎬 Media | 26 |
| 👑 Owner | 20 |
| ✍️ Text Maker | 18 |
| 🔧 Utility | 7 |
| **Total** | **141** |

--------:|:--------:|
| 🛡️ Admin | 21 |
| 🤖 AI | 3 |
| 🌸 Anime | 9 |
| 🎉 Fun | 13 |
| ⚙️ General | 21 |
| 🎬 Media | 11 |
| 👑 Owner | 18 |
| ✍️ Text Maker | 18 |
| 🔧 Utility | 3 |
| **Total** | **117** |

---

## 🆕 What's New in v2.0.0

- 📥 **New downloader engine** (`utils/providers.js`) — circuit breaker (a dead / over-quota API is skipped for minutes), hedged requests (next API starts if one is slow), first success wins
- 🎥 **YouTube** — keyless Savetube + ytmp3.mobi scrapers, btch backend, plus community REST APIs
- 📸 **Instagram** — SaveIG-style scrapers, btch backend, URL cleaner (`?igsh=` / `?knvt=` removed), carousel support with `1/5` captions, author + caption
- 🌐 **btch-downloader support, all endpoints** — `utils/btch.js` implements every endpoint (no heavy npm package): new `.twitter` `.threads` `.soundcloud` `.mediafire` `.gdrive` `.capcut` `.douyin` `.snackvideo` `.cocofun` `.kuaishou` `.rednote` `.aio` `.yts`
- 🎧 **`.spotify`** (track → audio), **`.igmp3`** (reel → MP3)
- 🧰 **New utilities** — `.reminder` (survives restarts), `.upscale`, `.removebg`, `.ocr`
- 🎲 **New fun** — `.quote` `.fact` `.wyr`
- 🧪 **Owner tools** — `.apitest` (live-test every downloader API from your host), `.botstats` (RAM / CPU / temp)
- ⚡ **Stability** — media streamed to temp files (fixes OOM exit 137), honest error messages, much lighter `node_modules` (~120 MB instead of ~340 MB)

---

## ✨ Features

- 🔓 **Fully Open Source** — edit, rebrand, and host anywhere, no permission needed
- 🧩 **Modular Command System** — each command is its own file under `commands/`
- 🎵 **Video → MP3** — convert replied videos to downloadable MP3 with `.mp3` / `.tomp3`
- 🖼️ **Auto Sticker** — auto-convert images/videos to WhatsApp stickers in groups
- 🔒 **Group Protection** — antilink, antitag, anti-group mention, mute/unmute
- 👋 **Welcome / Goodbye** — image-based join/leave messages with profile picture
- 🤖 **AI Commands** — ChatGPT text, image generation, magic studio
- 🎨 **Text Maker** — 18 stylized text effects (fire, neon, glitch, matrix, and more)
- 📲 **Media Downloaders** — YouTube, Instagram, TikTok, Facebook, Pinterest, Spotify, Twitter/X, Threads, SoundCloud, MediaFire, Google Drive, CapCut, Douyin, SnackVideo, CocoFun, Kuaishou, RedNote and more. Multi-provider with automatic failover (see *Downloader API Order*)
- ⚡ **RAM-Optimized** — streaming media handling + automatic temp file cleanup
- 🔄 **Auto React** — react to commands or all messages with emoji
- 🛡️ **Bot Admin Checks** — live metadata fetching for reliable admin operations

---

## 🚀 Quick Deploy

### Step 1 — Fork

<div align="center">

<a href="https://github.com/GouthamSER/KuttuBot-mini-MD/fork">
  <img src="https://img.shields.io/badge/Fork%20on%20GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/>
</a>

</div>

### Step 2 — Get Session ID

Generate a **pair code** to obtain your session string:

<div align="center">

<a href="https://qrkuttubot-md.antideploy.com/">
  <img src="https://img.shields.io/badge/Generate%20Pair%20Code-blueviolet?style=for-the-badge"/>
</a>

</div>

Paste the returned string into `config.js`:

```js
sessionID: 'KuttuBotMD!919876543210'
```


### Step 3 — Deploy

<div align="center">

<a href="https://dashboard.katabump.com/auth/login#d6b7d6">
  <img src="https://img.shields.io/badge/Deploy%20on%20Katabump-orange?style=for-the-badge"/>
</a>
&nbsp;
<a href="https://heroku.com/deploy?template=https://github.com/GouthamSER/KuttuBot-MD">
  <img src="https://img.shields.io/badge/Deploy%20on%20Heroku-430098?style=for-the-badge&logo=heroku&logoColor=white"/>
</a>
&nbsp;
<a href="https://render.com">
  <img src="https://img.shields.io/badge/Deploy%20on%20Render-46E3B7?style=for-the-badge&logo=render&logoColor=black"/>
</a>
&nbsp;
<a href="https://koyeb.com">
  <img src="https://img.shields.io/badge/Deploy%20on%20Koyeb-1DC0A0?style=for-the-badge"/>
</a>

</div>

<br/>

<div align="center">
  <a href="https://youtu.be/4PQcn-qqrcE">
    <img src="https://img.shields.io/badge/📺%20Video%20Tutorial-dc3545?style=for-the-badge&logo=youtube"/>
  </a>
</div>

---

## 🖥️ Local Setup (VPS / Ubuntu)

```bash
# 1. Clone
git clone https://github.com/GouthamSER/KuttuBot-mini-MD.git
cd KuttuBot-mini-MD

# 2. Install Node.js 20
sudo apt remove nodejs -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs ffmpeg

# 3. Install dependencies
npm install

# 4. Set session (edit config.js or export env var)
# Option A: paste session string in config.js  →  sessionID: 'your_string_here'
# Option B: scan QR                            →  sessionID: ''   then run bot

# 5. Start
node index.js
```

> **QR mode:** leave `sessionID` empty, run the bot, scan the QR from **WhatsApp → Linked Devices**.

---

## ⚙️ Configuration (`config.js`)

| Key | Description | Default |
|-----|-------------|---------|
| `sessionID` | Session string, format `KUTTU~<id>` (or empty for QR) | `''` |
| `prefix` | Command prefix | `.` |
| `botName` | Display name of the bot | `Kuttu Bot Mini` |
| `knightApiKey` | Key for Knight API (primary downloader). Env: `KNIGHT_API_KEY` | `knight` |
| `knightApiBase` | Knight API base URL. Env: `KNIGHT_API_BASE` | `https://knightbotapi.stream` |
| `removeBgApiKey` | remove.bg key for `.removebg`. Env: `REMOVEBG_API_KEY` | `''` |
| `ocrSpaceApiKey` | ocr.space key for `.ocr`. Env: `OCRSPACE_API_KEY` | demo key |
| `ownerNumber` | Your WhatsApp number(s) | `['91XXXXXXXXXX']` |
| `autoTyping` | Show typing indicator on commands | `true` |
| `autoReact` | Auto-react to messages | `false` |
| `selfMode` | Owner-only mode (private mode) | `false` |
| `blockedGroups` | Array of blacklisted group JIDs while in public mode | `[]` |

---

## 🚫 Antigroup (Block Specific Groups in Public Mode)

When the bot is running in **Public Mode** (`selfMode: false`), it responds to users across all groups. With **Antigroup**, the bot owner can block specific groups so the bot remains completely dormant/silent in those groups:

- **Block current group**: Send `.blockgroup [reason]` inside the group.
- **Block by JID**: Send `.blockgroup <groupJid> [reason]` (e.g. `.blockgroup 120363024849204892@g.us Toxic group`).
- **Unblock group**: Send `.unblockgroup [groupJid]`.
- **List blocked groups**: Send `.listblockedgroups` (or `.blockedgroups`).
- **Get group/chat JID**: Send `.jid` to copy the current group's JID.
- **Make bot leave group**: Send `.leave [groupJid]` to have the bot leave gracefully.

> **Storage:** Blocked groups are persisted in [database/antigroup.json](database/antigroup.json) and can also be defined in [config.js](config.js) under `blockedGroups`.

---

## 📥 Downloader API Order

Providers are tried in order, but the next one **starts early if the current one is slow** (4 s). A provider that fails with 402 / 429 / 404 / DNS / timeout is **skipped for 2–30 min** so one dead API never slows every request. Run **`.apitest`** (owner) to see which providers work from your host right now.

| Command | Order |
|---------|-------|
| `.song` | Knight → **Multi** (Savetube → ytmp3.mobi → btch → community APIs) → EliteProTech → Ruhend → Yupra → Okatsu → Izumi |
| `.video` | Knight → **Multi** (same chain) → EliteProTech → Ruhend → Yupra → Okatsu |
| `.instagram` / `.story` / `.igs` | Knight → SaveIG-style scrapers + btch + community APIs → ruhend `igdl` |
| `.tiktok` | Knight → btch `ttdl` → Siputzx |
| `.facebook` | Knight → btch `fbdown` → bochilteam scraper |
| `.pinterest` | Knight → nexray |
| `.spotify` | Spotify page → matched on YouTube via `.song` chain |
| `.twitter` `.threads` `.soundcloud` `.mediafire` `.gdrive` `.capcut` `.douyin` `.snackvideo` `.cocofun` `.kuaishou` `.rednote` `.aio` | btch backend |

**Add your own API without code** — set an env var with a JSON array, `{url}` is replaced by the link:

```bash
YT_AUDIO_APIS='["https://host/api/ytmp3?url={url}&apikey=XXX"]'
YT_VIDEO_APIS='["https://host/api/ytmp4?url={url}&apikey=XXX"]'
IG_APIS='["https://host/api/igdl?url={url}"]'
```

Other env vars: `KNIGHT_API_KEY`, `KNIGHT_API_BASE`, `BTCH_BASE`, `YT_VIDEO_QUALITY` (default `360`), `PROVIDER_HEDGE_MS` (default `4000`), `REMOVEBG_API_KEY`, `OCRSPACE_API_KEY`.

> **Tip:** if you get `402`/`429` from Knight, the shared default key is out of quota. Use your own key (`KNIGHT_API_KEY`) or rely on the fallbacks above.

---

## 🆕 New Commands (v2.0.0)

| Command | What it does |
|---------|--------------|
| `.igmp3 <reel link>` | Instagram reel → MP3 |
| `.spotify <track link>` | Spotify track → audio |
| `.twitter` `.threads` `.soundcloud` `.mediafire` `.gdrive` `.capcut` `.douyin` `.snackvideo` `.cocofun` `.kuaishou` `.rednote` `.aio` `<link>` | Download from that site |
| `.yts <text>` | YouTube search |
| `.reminder 10m text` / `list` / `cancel <id>` | Persistent reminders |
| `.upscale` | 2x enlarge + sharpen an image (reply to image) |
| `.removebg` | Remove image background (needs `REMOVEBG_API_KEY`) |
| `.ocr [lang]` | Read text from an image |
| `.quote` `.fact` `.wyr` | Random quote / fun fact / would-you-rather |
| `.apitest [yt\|ig]` | 👑 Live-test all downloader APIs from your host |
| `.botstats` | 👑 RAM / CPU / uptime / temp usage |

---

## 🎵 Media → MP3

Reply to any **video** (or audio) message and send:

```
.mp3
```
or
```
.tomp3
```

The bot converts it to a downloadable `.mp3` file using FFmpeg and sends it back.

---

## 📁 Project Structure

```
KuttuBot-mini-MD/
├── assets/           # logo.svg, logo.png
├── commands/
│   ├── admin/        # Group management (kick, mute, warn, antilink …)
│   ├── ai/           # AI features (ChatGPT, image gen)
│   ├── anime/        # Anime image commands
│   ├── fun/          # Fun commands (truth, dare, tictactoe …)
│   ├── general/      # Sticker, TTS, translate, QR …
│   ├── media/        # YouTube, TikTok, Instagram, MP3 converter …
│   ├── owner/        # Bot management (restart, update, broadcast …)
│   ├── textmaker/    # Stylized text effects
│   └── utility/      # Reminder, upscale, removebg, OCR, calc, weather
├── utils/
│   ├── converter.js  # FFmpeg wrappers (toAudio, toPTT, toVideo)
│   ├── tempManager.js
│   ├── api.js        # Knight + legacy APIs, TikTok/FB chains
│   ├── providers.js  # Multi-provider engine (breaker, hedging, scrapers)
│   ├── btch.js       # All btch-downloader endpoints (no npm package)
│   ├── btchSend.js   # Shared factory for btch-based commands
│   ├── igMedia.js    # IG CDN streaming helper
│   ├── reminders.js  # Persistent reminders
│   └── sticker.js
├── config.js
├── handler.js
├── database.js
└── index.js
```

---

## 🌐 Community & Support

<div align="center">

<a href="https://t.me/im_goutham_josh">
  <img src="https://img.shields.io/badge/Telegram-DM%20Me-0088cc?style=for-the-badge&logo=telegram&logoColor=white"/>
</a>

</div>

---

## 🙏 Credits

| | |
|---|---|
| **Goutham SER** | Re-edited & maintains Mini version |
| **Mr Unique Hacker** | Original developer |
| **@whiskeysockets/baileys** | WhatsApp Web API |
| All `package.json` contributors | Open-source libs |

---

## ☕ Support the Developer

<div align="center">

<a href="upi://pay?pa=gouthamjosh@sbi&pn=Goutham%20Josh&tn=Thanku%20For%20Helping%20Us%20:)&cu=INR">
  <img src="https://img.shields.io/badge/GPay-Support%20Dev-FF813F?style=for-the-badge&logo=googlepay&logoColor=white"/>
</a>

<br/><br/>

<img src="https://i.ibb.co/xtsZZCMg/download.png" alt="Support QR" width="180"/>

</div>

---

## ⚠️ Disclaimer

- Built **for educational purposes only**
- **NOT** an official WhatsApp product
- Using third-party bots **may violate WhatsApp ToS** and risk account bans
- Use **at your own risk** — developers are not responsible for bans or damages
- **Do not** use for spam, bulk messaging, harassment, or illegal activities

---

## 📄 License

MIT License — Copyright © 2026 **Goutham Josh**

You are free to use, modify, and distribute this project provided you:
- Keep original license and copyright notices
- Credit the original authors
- Do not use for spam or malicious purposes

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0072ff,100:00c6ff&height=120&section=footer"/>

</div>
