/**
 * Global Configuration for WhatsApp MD Bot
 */

module.exports = {
    // Bot Owner Configuration
    ownerNumber: ['917034898741','917034898741'], // Add your number without + or spaces (e.g., 919876543210)
    ownerName: ['Kuttu Bot Mini', 'Goutham Josh'], // Owner names corresponding to ownerNumber array
    
    // Bot Configuration
    botName: 'Kuttu Bot Mini',
    prefix: '.',
    sessionName: 'session',
    sessionID: process.env.SESSION_ID || 'SESSION_ID=eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiR0UzbklzYWZ2UDFDeUVjclJDQ2NMSUs0eThlQ096bGZJd2dtbEwwSkpIcz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoidUNjcFEybXhtdko3Q240cVRZcUpmdzN0MVdGeVlLRDQ2c3VaMjJvNG9EMD0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJXT0NDRmcwVjRPcThUcE1LYVRmS1JFeTRJbFZYaUowWlVrSGN6YnN0RjFrPSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJyeHBxRjdmSnNwQUd1UUtoQmt2c1phUjQveEUwTXA0T1UvbUV6MXBtR1FvPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6ImlOZktqL3RqbWFiLzJLbU1xM0RNQmRHVDFacEdyNDJyem1sTWRJb1NUbmc9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IjdWT1B5TlhEeGIva3hxSXpBR3daTlRYa1ZqbU0vM1VmSHJjTHNuRVQzZ1U9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiOEhSZU9lcjQwcVJNT0ExeEViUVBpSHM3QkVORzRLbDBNajlHOSthRFpIMD0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiL1RPaC9MWUNmRW5BNGpXRWJMRWpnVmdpY29BNGRBZ2hXU05raVNXUy9Hdz0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6Ijd4SUxGWFhPZXZNVGNyMSs1T2tLcjFVQVFxeUlXZVQyL05EVkJOTEZTeDcwTkhGc096V1Z1bUJ0UXdoWEErZFZhK215UzgvRjdDVzF5cVpocXBGZkRnPT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6MTk3LCJhZHZTZWNyZXRLZXkiOiI4Q09LeVhDMFFFd0loSnZPQzc3UGZoN2l0TFJwdUZLSjVjeWVMcUh4U0kwPSIsInByb2Nlc3NlZEhpc3RvcnlNZXNzYWdlcyI6W10sIm5leHRQcmVLZXlJZCI6MzEsImZpcnN0VW51cGxvYWRlZFByZUtleUlkIjozMSwiYWNjb3VudFN5bmNDb3VudGVyIjowLCJhY2NvdW50U2V0dGluZ3MiOnsidW5hcmNoaXZlQ2hhdHMiOmZhbHNlfSwicmVnaXN0ZXJlZCI6dHJ1ZSwicGFpcmluZ0NvZGUiOiIyOTJIRE5NNyIsIm1lIjp7ImlkIjoiOTE2MjM4NDM1NTY4OjE5QHMud2hhdHNhcHAubmV0In0sImFjY291bnQiOnsiZGV0YWlscyI6IkNLVFkyZG9CRUovcHBkTUdHQThnQUNnQSIsImFjY291bnRTaWduYXR1cmVLZXkiOiJxWm1ub2FjdmxZVXRIWll5WmFtMDA5eisyZzFLa205UnovTGNDZDJUeTJnPSIsImFjY291bnRTaWduYXR1cmUiOiJYNHdpZ25Lb0Z6RUVEYVg4dDFWTTZUSmZObTV5alNQRWZ4ZkgyWk81b0s1WllndEw4RUo4YVVUYng3aHJickJtdHR3eEMrTFpmekR1SDJiaFhjeGREZz09IiwiZGV2aWNlU2lnbmF0dXJlIjoiM29jRWVpN2JBVloremVscE0xNlB3SUNsaTJJaENiaWlOR01QTlJ1TFV0ZDZxekZDNkh0RHJPYWR3UjdpQnlFenpLOWN4aC9iakJQbjR6bndhVFU3Qmc9PSJ9LCJzaWduYWxJZGVudGl0aWVzIjpbeyJpZGVudGlmaWVyIjp7Im5hbWUiOiI5MTYyMzg0MzU1Njg6MTlAcy53aGF0c2FwcC5uZXQiLCJkZXZpY2VJZCI6MH0sImlkZW50aWZpZXJLZXkiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJCYW1acDZHbkw1V0ZMUjJXTW1XcHROUGMvdG9OU3BKdlVjL3kzQW5kazh0byJ9fV0sInBsYXRmb3JtIjoiYW5kcm9pZCIsInJvdXRpbmdJbmZvIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQ0FnSUJRZ04ifSwibGFzdEFjY291bnRTeW5jVGltZXN0YW1wIjoxNzg1Mjk2MDM2fQ==',
    newsletterJid: '120363161513685998@newsletter', // Newsletter JID for menu forwarding
    updateZipUrl: 'https://github.com/GouthamSER/KuttuBot-mini-MD/archive/refs/heads/main.zip', // Used for local/VPS update (ZIP)
    updateTarUrl: 'https://github.com/GouthamSER/KuttuBot-mini-MD/archive/refs/heads/main.tar.gz', // Used for Heroku build trigger (tar.gz required by Platform API)
    
    // Sticker Configuration
    packname: 'Kuttu Bot Mini',
    
    // Bot Behavior
    selfMode: false, // Private mode - only owner can use commands
    autoRead: false,
    autoTyping: false,
    autoBio: false,
    autoSticker: false,
    autoReact: false,
    autoReactMode: 'bot', // set bot or all via cmd
    autoDownload: false,
    
    // Group Settings Defaults
    defaultGroupSettings: {
      antilink: false,
      antilinkAction: 'delete', // 'delete', 'kick', 'warn'
      antitag: false,
      antitagAction: 'delete',
      antiall: false, // Owner only - blocks all messages from non-admins
      antiviewonce: false,
      antibot: false,
      anticall: false, // Anti-call feature
      antigroupmention: false, // Anti-group mention feature
      antigroupmentionAction: 'delete', // 'delete', 'kick'
      welcome: false,
      welcomeMessage: '╭╼━≪•𝙽𝙴𝚆 𝙼𝙴𝙼𝙱𝙴𝚁•≫━╾╮\n┃𝚆𝙴𝙻𝙲𝙾𝙼𝙴: @user 👋\n┃Member count: #memberCount\n┃𝚃𝙸𝙼𝙴: time⏰\n╰━━━━━━━━━━━━━━━╯\n\n*@user* Welcome to *@group*! 🎉\n*Group 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽*\ngroupDesc\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ botName*',
      goodbye: false,
      goodbyeMessage: 'Goodbye @user 👋 We will never miss you!',
      antiSpam: false,
      antidelete: false,
      nsfw: false,
      detect: false,
      chatbot: false,
      autosticker: false // Auto-convert images/videos to stickers
    },
    
    // API Keys (add your own)
    apiKeys: {
      // Add API keys here if needed
      openai: '',
      deepai: '',
      remove_bg: ''
    },
    
    // Message Configuration
    messages: {
      wait: '⏳ Please wait...',
      success: '✅ Success!',
      error: '❌ Error occurred!',
      ownerOnly: '👑 This command is only for bot owner!',
      adminOnly: '🛡️ This command is only for group admins!',
      groupOnly: '👥 This command can only be used in groups!',
      privateOnly: '💬 This command can only be used in private chat!',
      botAdminNeeded: '🤖 Bot needs to be admin to execute this command!',
      invalidCommand: '❓ Invalid command! Type .menu for help'
    },
    
    // Timezone
    timezone: 'Asia/Kolkata',
    
    // Limits
    maxWarnings: 3,
    
    // Social Links (optional)
    social: {
      github: 'https://github.com/GouthamSER',
      instagram: 'https://instagram.com/im_goutham_josh',
      youtube: 'http://youtube.com/@mr_unique_hacker'
    }
};
      antitagAction: 'delete',
      antiall: false, // Owner only - blocks all messages from non-admins
      antiviewonce: false,
      antibot: false,
      anticall: false, // Anti-call feature
      antigroupmention: false, // Anti-group mention feature
      antigroupmentionAction: 'delete', // 'delete', 'kick'
      welcome: false,
      welcomeMessage: '╭╼━≪•𝙽𝙴𝚆 𝙼𝙴𝙼𝙱𝙴𝚁•≫━╾╮\n┃𝚆𝙴𝙻𝙲𝙾𝙼𝙴: @user 👋\n┃Member count: #memberCount\n┃𝚃𝙸𝙼𝙴: time⏰\n╰━━━━━━━━━━━━━━━╯\n\n*@user* Welcome to *@group*! 🎉\n*Group 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽*\ngroupDesc\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ botName*',
      goodbye: false,
      goodbyeMessage: 'Goodbye @user 👋 We will never miss you!',
      antiSpam: false,
      antidelete: false,
      nsfw: false,
      detect: false,
      chatbot: false,
      autosticker: false // Auto-convert images/videos to stickers
    },
    
    // API Keys (add your own)
    apiKeys: {
      // Add API keys here if needed
      openai: '',
      deepai: '',
      remove_bg: ''
    },
    
    // Message Configuration
    messages: {
      wait: '⏳ Please wait...',
      success: '✅ Success!',
      error: '❌ Error occurred!',
      ownerOnly: '👑 This command is only for bot owner!',
      adminOnly: '🛡️ This command is only for group admins!',
      groupOnly: '👥 This command can only be used in groups!',
      privateOnly: '💬 This command can only be used in private chat!',
      botAdminNeeded: '🤖 Bot needs to be admin to execute this command!',
      invalidCommand: '❓ Invalid command! Type .menu for help'
    },
    
    // Timezone
    timezone: 'Asia/Kolkata',
    
    // Limits
    maxWarnings: 3,
    
    // Social Links (optional)
    social: {
      github: 'https://github.com/GouthamSER',
      instagram: 'https://instagram.com/im_goutham_josh',
      youtube: 'http://youtube.com/@mr_unique_hacker'
    }
};
