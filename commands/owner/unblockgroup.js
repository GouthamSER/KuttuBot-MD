/**
 * Unblock Group Command
 * Removes a group from the antigroup blacklist so the bot responds in public mode
 */

const database = require('../../database');
const config = require('../../config');

module.exports = {
  name: 'unblockgroup',
  aliases: ['unantigroup', 'unbangroup', 'unblacklistgroup', 'unbgroup', 'unblockg'],
  category: 'owner',
  description: 'Unblock a group to restore bot commands in public mode',
  usage: '.unblockgroup [groupJid]',
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      let targetJid = null;

      // Check if argument 0 looks like a group JID or numeric group ID
      if (args[0] && (args[0].endsWith('@g.us') || /^\d{15,22}(@g\.us)?$/.test(args[0]))) {
        targetJid = args[0].includes('@') ? args[0] : `${args[0]}@g.us`;
      } else if (extra.isGroup) {
        // Used inside a group
        targetJid = extra.from;
      } else {
        return extra.reply(
          `❌ *Invalid Usage!*\n\n` +
          `📌 *How to use:*\n` +
          `• In a group: \`${config.prefix}unblockgroup\`\n` +
          `• From private chat: \`${config.prefix}unblockgroup <groupJid>\`\n\n` +
          `💡 *Example:* \`${config.prefix}unblockgroup 120363024849204892@g.us\``
        );
      }

      // Check if currently blocked
      if (!database.isGroupBlocked(targetJid)) {
        return extra.reply(
          `⚠️ *This group is NOT blocked!*\n\n` +
          `🆔 *JID:* \`${targetJid}\`\n\n` +
          `The bot is already active in this group.`
        );
      }

      // Remove from database
      const success = database.unblockGroup(targetJid);
      const senderNum = extra.sender ? extra.sender.split('@')[0] : 'owner';

      if (success) {
        const responseText =
          `✅ *GROUP UNBLOCKED SUCCESSFULLY* ✅\n\n` +
          `The bot has been restored and will now respond to commands in this group.\n\n` +
          `🆔 *JID:* \`${targetJid}\`\n` +
          `👤 *Unblocked By:* @${senderNum}\n` +
          `📅 *Time:* ${new Date().toLocaleString('en-US', { timeZone: config.timezone || 'Asia/Kolkata' })}`;

        await sock.sendMessage(extra.from, {
          text: responseText,
          mentions: [extra.sender]
        }, { quoted: msg });
      } else {
        await extra.reply(`❌ Failed to unblock group \`${targetJid}\`.`);
      }

    } catch (error) {
      console.error('Unblockgroup command error:', error);
      await extra.reply(`❌ Error unblocking group: ${error.message}`);
    }
  }
};
