<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00c6ff,100:0072ff&height=200&section=header&text=KuttuBot%20Mini%20MD&fontSize=48&fontColor=ffffff&fontAlignY=38&desc=WhatsApp%20MD%20Bot%20powered%20by%20Baileys&descAlignY=58&descFontColor=ffffffcc" />

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Baileys](https://img.shields.io/badge/Baileys-v7-00bcd4?style=for-the-badge)](https://github.com/WhiskeySockets/Baileys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-✓-brightgreen?style=for-the-badge)](https://github.com/GouthamSER/KuttuBot-mini-MD)

<br/>

<img src="utils/bot_image.jpg" alt="KuttuBot Mini" width="220" style="border-radius:16px"/>

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
| 🎉 Fun | 13 |
| ⚙️ General | 20 |
| 🎬 Media | 9 |
| 👑 Owner | 14 |
| ✍️ Text Maker | 18 |
| 🔧 Utility | 3 |
| **Total** | **110+** |

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
- 📲 **Media Downloaders** — YouTube (song/video), TikTok, Instagram, Facebook, Pinterest
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

<a href="https://qrkuttubot-md.koyeb.app/">
  <img src="https://img.shields.io/badge/Generate%20Pair%20Code-blueviolet?style=for-the-badge"/>
</a>

</div>

Paste the returned string into `config.js`:

```js
sessionID: 'KUTTU~919876543210'
```

Or set via environment variable: `SESSION_ID=KUTTU~919876543210`

> **Required:** set a `MONGODB_URI` env var (same connection string used by the session generator) so the bot can fetch your saved session on every startup. Free cluster: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

### Step 3 — Deploy

<div align="center">

<a href="https://dashboard.katabump.com/auth/login#d6b7d6">
  <img src="https://img.shields.io/badge/Deploy%20on%20Katabump-orange?style=for-the-badge"/>
</a>
&nbsp;
<a href="https://heroku.com">
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
| `botName` | Display name of the bot | `KuttuBot Mini` |
| `ownerNumber` | Your WhatsApp number(s) | `['91XXXXXXXXXX']` |
| `autoTyping` | Show typing indicator on commands | `true` |
| `autoReact` | Auto-react to messages | `false` |
| `selfMode` | Owner-only mode | `false` |

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
├── commands/
│   ├── admin/        # Group management (kick, mute, warn, antilink …)
│   ├── ai/           # AI features (ChatGPT, image gen)
│   ├── anime/        # Anime image commands
│   ├── fun/          # Fun commands (truth, dare, tictactoe …)
│   ├── general/      # Sticker, TTS, translate, QR …
│   ├── media/        # YouTube, TikTok, Instagram, MP3 converter …
│   ├── owner/        # Bot management (restart, update, broadcast …)
│   ├── textmaker/    # Stylized text effects
│   └── utility/      # Calc, translate, weather
├── utils/
│   ├── converter.js  # FFmpeg wrappers (toAudio, toPTT, toVideo)
│   ├── tempManager.js
│   ├── api.js
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
