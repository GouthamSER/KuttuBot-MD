/**
 * Get an image buffer from the message itself or the message it replies to.
 * Returns { buffer, mimetype } or null.
 */
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function getImageBuffer(sock, msg, from) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo
    || msg.message?.imageMessage?.contextInfo;
  let target = null;

  if (msg.message?.imageMessage) {
    target = msg;
  } else if (ctx?.quotedMessage) {
    const q = ctx.quotedMessage;
    const inner = q.imageMessage ? q
      : q.viewOnceMessage?.message?.imageMessage ? q.viewOnceMessage.message
      : q.documentMessage?.mimetype?.startsWith('image/') ? q : null;
    if (inner) target = { key: { remoteJid: from, id: ctx.stanzaId, participant: ctx.participant }, message: inner };
  }
  if (!target) return null;

  const buffer = await downloadMediaMessage(target, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
  if (!buffer || !buffer.length) return null;
  return { buffer };
}

module.exports = { getImageBuffer };
