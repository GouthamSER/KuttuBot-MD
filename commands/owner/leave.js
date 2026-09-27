/**
 * Leave Group Command
 * Allows the bot owner to make the bot leave a group gracefully
 */

const config = require('../../config');

module.exports = {
  name: 'leave',
  aliases: ['leavegroup', 'left', 'out', 'botleave'],
  category: 'owner',
  description: 'Make the bot leave a group',
  usage: '.leave [groupJid]',
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      let targetJid = null;

      if (args[0] && (args[0].endsWith('@g.us') || /^\d{15,22}(@g\.us)?$/.test(args[0]))) {
        targetJid = args[0].includes('@') ? args[0] : `${args[0]}@g.us`;
      } else if (extra.isGroup) {
        targetJid = extra.from;
      } else {
        return extra.reply(
          `❌ *Invalid Usage!*\n\n` +
          `📌 *How to use:*\n` +
          `• In a group: \`${config.prefix}leave\`\n` +
          `• From private chat: \`${config.prefix}leave <groupJid>\``
        );
      }

      // Send goodbye message in the target group before leaving
      try {
        await sock.sendMessage(targetJid, {
          text: `👋 Goodbye everyone! *${config.botName}* is leaving this group.`
        });
      } catch (e) {
        // Continue even if message cannot be sent (e.g. muted group)
      }

      // Small delay so message delivers
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Leave the group
      await sock.groupLeave(targetJid);

      // If called from private chat or another group, notify the caller
      if (extra.from !== targetJid) {
        await extra.reply(`✅ Successfully left group: \`${targetJid}\``);
      }

    } catch (error) {
      console.error('Leave command error:', error);
      await extra.reply(`❌ Error leaving group: ${error.message}`);
    }
  }
};
