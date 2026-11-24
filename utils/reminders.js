/**
 * Persistent reminders. Stored in database/reminders.json so they survive restarts.
 * init(sock) is called on every connection open: it re-arms all pending reminders.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'database', 'reminders.json');
const MAX_TIMEOUT = 2 ** 31 - 1; // setTimeout limit (~24.8 days)
const MAX_PER_USER = 20;

let sockRef = null;
const timers = new Map();

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return []; }
}
function save(list) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
  } catch (e) { console.error('[reminders] save failed:', e.message); }
}

// "10m", "2h", "1d", "1h30m", "45s"  -> ms (or null)
function parseDuration(str) {
  const re = /(\d+)\s*([smhdw])/gi;
  const unit = { s: 1e3, m: 6e4, h: 36e5, d: 864e5, w: 6048e5 };
  let total = 0, matched = '', m;
  while ((m = re.exec(str))) { total += parseInt(m[1], 10) * unit[m[2].toLowerCase()]; matched += m[0]; }
  if (!total || matched.replace(/\s/g, '').toLowerCase() !== str.replace(/\s/g, '').toLowerCase()) return null;
  return total;
}

function arm(entry) {
  clearTimeout(timers.get(entry.id));
  const wait = Math.max(0, entry.at - Date.now());
  const t = setTimeout(() => {
    if (entry.at - Date.now() > 1000) return arm(entry); // long reminder: re-arm chunk
    fire(entry);
  }, Math.min(wait, MAX_TIMEOUT));
  timers.set(entry.id, t);
}

async function fire(entry) {
  timers.delete(entry.id);
  const late = Date.now() - entry.at > 60000;
  try {
    if (sockRef) {
      await sockRef.sendMessage(entry.chat, {
        text: `⏰ *Reminder*${late ? ' _(delayed, bot was offline)_' : ''}\n\n@${entry.user.split('@')[0]} ${entry.text}`,
        mentions: [entry.user]
      });
    }
  } catch (e) {
    console.error('[reminders] send failed:', e.message);
    return; // keep in file, retried at next init
  }
  save(load().filter((r) => r.id !== entry.id));
}

function init(sock) {
  sockRef = sock;
  load().forEach(arm);
}

function add({ chat, user, text, ms }) {
  const list = load();
  if (list.filter((r) => r.user === user).length >= MAX_PER_USER) return { error: `Max ${MAX_PER_USER} reminders per user.` };
  const entry = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 4), chat, user, text, at: Date.now() + ms };
  list.push(entry);
  save(list);
  arm(entry);
  return { entry };
}

function listFor(user) { return load().filter((r) => r.user === user).sort((a, b) => a.at - b.at); }

function cancel(user, id) {
  const list = load();
  const hit = list.find((r) => r.id === id && r.user === user);
  if (!hit) return false;
  clearTimeout(timers.get(id));
  timers.delete(id);
  save(list.filter((r) => r.id !== id));
  return true;
}

module.exports = { init, add, listFor, cancel, parseDuration };
