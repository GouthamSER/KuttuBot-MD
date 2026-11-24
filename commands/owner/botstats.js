/**
 * Bot Stats (owner) - RAM / CPU / disk of the container the bot runs in
 * Reads cgroup limits so you see the REAL container RAM, not the host's.
 */
const os = require('os');
const fs = require('fs');
const path = require('path');
const { getTempDir } = require('../../utils/tempManager');

const mb = (b) => (b / 1048576).toFixed(1) + ' MB';
const readNum = (f) => {
  try {
    const v = fs.readFileSync(f, 'utf8').trim();
    return v === 'max' ? null : parseInt(v, 10);
  } catch { return null; }
};

function dirSize(dir) {
  let total = 0, count = 0;
  try {
    for (const f of fs.readdirSync(dir)) {
      try { const st = fs.statSync(path.join(dir, f)); if (st.isFile()) { total += st.size; count++; } } catch {}
    }
  } catch {}
  return { total, count };
}

function bar(pct) {
  const n = Math.max(0, Math.min(10, Math.round(pct / 10)));
  return '█'.repeat(n) + '░'.repeat(10 - n) + ` ${pct.toFixed(0)}%`;
}

module.exports = {
  name: 'botstats',
  aliases: ['sysinfo', 'ram', 'botinfo'],
  category: 'owner',
  description: 'Show bot RAM / CPU / temp usage (owner only)',
  usage: '.botstats',
  ownerOnly: true,

  async execute(sock, msg, args, extra) {
    if (!extra.isOwner) return extra.reply('❌ Owner only.');

    const mem = process.memoryUsage();
    // cgroup v2 then v1
    const limit = readNum('/sys/fs/cgroup/memory.max') ?? readNum('/sys/fs/cgroup/memory/memory.limit_in_bytes');
    const used = readNum('/sys/fs/cgroup/memory.current') ?? readNum('/sys/fs/cgroup/memory/memory.usage_in_bytes');
    const hostTotal = os.totalmem();
    const realLimit = limit && limit < hostTotal * 2 ? Math.min(limit, hostTotal) : null;

    const temp = dirSize(getTempDir());
    const load = os.loadavg();
    const cpus = os.cpus().length;

    let t = `╭━━『 *Bot Stats* 』━━╮\n\n`;
    t += `🧠 *Bot process (RSS):* ${mb(mem.rss)}\n`;
    t += `📦 *Heap:* ${mb(mem.heapUsed)} / ${mb(mem.heapTotal)}\n`;
    t += `🔌 *External/Buffers:* ${mb(mem.external + mem.arrayBuffers)}\n\n`;
    if (realLimit && used) {
      t += `🐳 *Container RAM:* ${mb(used)} / ${mb(realLimit)}\n   ${bar((used / realLimit) * 100)}\n`;
    } else {
      t += `💾 *Host RAM free:* ${mb(os.freemem())} / ${mb(hostTotal)} _(no container limit detected)_\n`;
    }
    t += `\n⚙️ *CPU load (1/5/15m):* ${load.map((x) => x.toFixed(2)).join(' / ')}  (${cpus} cores)\n`;
    t += `🗂️ *Temp folder:* ${temp.count} files, ${mb(temp.total)}\n`;
    t += `⏱️ *Uptime:* ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m\n`;
    t += `🟢 *Node:* ${process.version}  |  ${os.platform()} ${os.arch()}\n`;
    t += `\n╰━━━━━━━━━━━━━━━╯`;
    await extra.reply(t);
  }
};
