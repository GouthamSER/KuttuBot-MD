/**
 * Reminder - .reminder 10m drink water | .reminder 1h30m call mom
 * .reminder list | .reminder cancel <id>
 */
const R = require('../../utils/reminders');

const fmt = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (sec && !d) parts.push(`${sec}s`);
  return parts.length ? parts.join(' ') : '0s';
};

module.exports = {
  name: 'reminder',
  aliases: ['remind', 'remindme'],
  category: 'utility',
  description: 'Set a reminder (survives bot restarts)',
  usage: '.reminder <10m|2h|1d|1h30m> <text> | .reminder list | .reminder cancel <id>',

  async execute(sock, msg, args, extra) {
    const user = extra.sender;
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'list') {
      const mine = R.listFor(user);
      if (!mine.length) return extra.reply('📭 You have no pending reminders.');
      return extra.reply('⏰ *Your reminders*\n\n' + mine.map((r) => `• \`${r.id}\` — in ${fmt(r.at - Date.now())}\n  ${r.text}`).join('\n\n') + '\n\n_Cancel: .reminder cancel <id>_');
    }

    if (sub === 'cancel' || sub === 'del') {
      if (!args[1]) return extra.reply('Usage: .reminder cancel <id>');
      return extra.reply(R.cancel(user, args[1]) ? '🗑️ Reminder cancelled.' : '❌ No reminder with that id (yours only).');
    }

    // duration may be split like "1h 30m" -> take leading tokens that parse as duration parts
    let i = 0, durStr = '';
    while (i < args.length && /^(\d+[smhdw])+$/i.test(args[i])) durStr += args[i++];
    const text = args.slice(i).join(' ').trim();
    const ms = durStr ? R.parseDuration(durStr) : null;

    if (!ms || !text) {
      return extra.reply('⏰ *Reminder*\n\n.reminder 10m drink water\n.reminder 1h30m call mom\n.reminder list\n.reminder cancel <id>\n\n_Units: s m h d w (max 60 days)_');
    }
    if (ms < 5000) return extra.reply('❌ Minimum 5 seconds.');
    if (ms > 60 * 864e5) return extra.reply('❌ Maximum 60 days.');
    if (text.length > 500) return extra.reply('❌ Reminder text too long (max 500 chars).');

    const { entry, error } = R.add({ chat: extra.from, user, text, ms });
    if (error) return extra.reply(`❌ ${error}`);
    await extra.reply(`✅ Reminder set for *${fmt(ms)}* from now.\nID: \`${entry.id}\``);
  }
};
