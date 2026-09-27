/**
 * List Blocked Groups Command
 * Displays all groups currently blacklisted/blocked from using the bot
 */

const database = require('../../database');
const config = require('../../config');

module.exports = {
  name: 'listblockedgroups',
  aliases: ['blockedgroups', 'antigrouplist', 'listbgroup', 'bgroupnames', 'blacklistgroups'],
  category: 'owner',
  description: 'List all groups blocked from using the bot in public mode',
  usage: '.listblockedgroups',
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      const blockedList = database.getBlockedGroupsList();

      if (!blockedList || blockedList.length === 0) {
        return extra.reply(
          `📋 *BLOCKED GROUPS LIST*\n\n` +
          `✅ No groups are currently blocked.\n` +
          `The bot is active and accessible across all groups in public mode.\n\n` +
          `💡 *To block a group:*\n` +
          `• In a group: \`${config.prefix}blockgroup [reason]\`\n` +
          `• Using JID: \`${config.prefix}blockgroup <groupJid> [reason]\``
        );
      }

      let message = `╭━━━『 *BLOCKED GROUPS* 』━━━╮\n`;
      message += `┃ 🚫 Total Blocked: *${blockedList.length}*\n`;
      message += `┃ 🤖 Bot Mode: *${config.selfMode ? 'PRIVATE' : 'PUBLIC'}*\n`;
      message += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

      blockedList.forEach((item, index) => {
        const dateStr = item.blockedAt
          ? new Date(item.blockedAt).toLocaleDateString('en-US', {
              timeZone: config.timezone || 'Asia/Kolkata',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          : 'N/A';

        message += `*${index + 1}. ${item.name || 'Unnamed Group'}*\n`;
        message += `  ├ 🆔 JID: \`${item.jid}\`\n`;
        message += `  ├ 📝 Reason: ${item.reason || 'No reason specified'}\n`;
        message += `  ├ 👤 Blocked By: ${item.blockedBy || 'owner'}\n`;
        message += `  └ 📅 Date: ${dateStr}\n\n`;
      });

      message += `💡 *To unblock a group:*\n`;
      message += `\`${config.prefix}unblockgroup <groupJid>\``;

      await extra.reply(message);

    } catch (error) {
      console.error('Listblockedgroups error:', error);
      await extra.reply(`❌ Error fetching blocked groups: ${error.message}`);
    }
  }
};
