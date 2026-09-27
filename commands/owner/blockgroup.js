/**
 * Block Group Command
 * Blocks a specific group from using bot commands while the bot is in public mode
 */

const database = require('../../database');
const config = require('../../config');

module.exports = {
  name: 'blockgroup',
  aliases: ['antigroup', 'bangroup', 'blacklistgroup', 'bgroup', 'blockg'],
  category: 'owner',
  description: 'Block a specific group from using the bot in public mode',
  usage: '.blockgroup [groupJid] [reason]',
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    try {
      let targetJid = null;
      let reason = 'Blocked by owner';
      let groupName = 'Group';

      // Check if argument 0 looks like a group JID or numeric group ID
      if (args[0] && (args[0].endsWith('@g.us') || /^\d{15,22}(@g\.us)?$/.test(args[0]))) {
        targetJid = args[0].includes('@') ? args[0] : `${args[0]}@g.us`;
        if (args.length > 1) {
          reason = args.slice(1).join(' ').trim();
        }
      } else if (extra.isGroup) {
        // Used inside a group without group JID argument
        targetJid = extra.from;
        if (args.length > 0) {
          reason = args.join(' ').trim();
        }
        if (extra.groupMetadata && extra.groupMetadata.subject) {
          groupName = extra.groupMetadata.subject;
        }
      } else {
        return extra.reply(
          `❌ *Invalid Usage!*\n\n` +
          `📌 *How to use:*\n` +
          `• In a group: \`${config.prefix}blockgroup [reason]\`\n` +
          `• From private chat: \`${config.prefix}blockgroup <groupJid> [reason]\`\n\n` +
          `💡 *Example:* \`${config.prefix}blockgroup 120363024849204892@g.us Toxic group\``
        );
      }

      // Check if already blocked
      if (database.isGroupBlocked(targetJid)) {
        return extra.reply(
          `⚠️ *Group is already blocked!*\n\n` +
          `🆔 *JID:* \`${targetJid}\`\n\n` +
          `💡 *To unblock:* \`${config.prefix}unblockgroup ${targetJid}\``
        );
      }

      // Try to fetch group name if not already known
      if (groupName === 'Group') {
        try {
          const meta = await sock.groupMetadata(targetJid);
          if (meta && meta.subject) {
            groupName = meta.subject;
          }
        } catch (e) {
          // Keep fallback name if group metadata fetch fails
        }
      }

      // Save to database
      const senderNum = extra.sender ? extra.sender.split('@')[0] : 'owner';
      database.blockGroup(targetJid, {
        name: groupName,
        reason,
        blockedBy: senderNum
      });

      const responseText =
        `🚫 *GROUP BLOCKED SUCCESSFULLY* 🚫\n\n` +
        `The bot will no longer respond to commands, games, or auto-features in this group while in public mode.\n\n` +
        `🏷️ *Group:* ${groupName}\n` +
        `🆔 *JID:* \`${targetJid}\`\n` +
        `📝 *Reason:* ${reason}\n` +
        `👤 *Blocked By:* @${senderNum}\n` +
        `📅 *Time:* ${new Date().toLocaleString('en-US', { timeZone: config.timezone || 'Asia/Kolkata' })}\n\n` +
        `💡 *To unblock:* \`${config.prefix}unblockgroup ${targetJid}\``;

      await sock.sendMessage(extra.from, {
        text: responseText,
        mentions: [extra.sender]
      }, { quoted: msg });

    } catch (error) {
      console.error('Blockgroup command error:', error);
      await extra.reply(`❌ Error blocking group: ${error.message}`);
    }
  }
};
