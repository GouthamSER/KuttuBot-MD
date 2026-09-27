/**
 * JID Command
 * Retrieve the JID of the current chat, group, or quoted user
 */

module.exports = {
  name: 'jid',
  aliases: ['groupjid', 'getjid', 'myjid'],
  category: 'general',
  description: 'Get the JID of current group, chat, or quoted user',
  usage: '.jid [reply to message]',

  async execute(sock, msg, args, extra) {
    try {
      const ctx = msg.message?.extendedTextMessage?.contextInfo;
      const quotedParticipant = ctx?.participant;
      const mentions = ctx?.mentionedJid || [];

      let responseText = `🆔 *JID INFORMATION*\n\n`;

      if (extra.isGroup) {
        responseText += `👥 *Group JID:*\n\`${extra.from}\`\n\n`;
      } else {
        responseText += `💬 *Chat JID:*\n\`${extra.from}\`\n\n`;
      }

      responseText += `👤 *Your JID:*\n\`${extra.sender}\`\n\n`;

      if (quotedParticipant) {
        responseText += `💬 *Quoted User JID:*\n\`${quotedParticipant}\`\n\n`;
      }

      if (mentions.length > 0) {
        responseText += `🏷️ *Mentioned JIDs:*\n`;
        mentions.forEach((m, idx) => {
          responseText += `${idx + 1}. \`${m}\`\n`;
        });
      }

      await sock.sendMessage(extra.from, {
        text: responseText.trim()
      }, { quoted: msg });

    } catch (error) {
      console.error('Jid command error:', error);
      await extra.reply(`❌ Error getting JID: ${error.message}`);
    }
  }
};
