const { makeBtchCommand } = require('../../utils/btchSend');
module.exports = makeBtchCommand({ name: 'gdrive', aliases: ['gd', 'drivedl', 'gdl', 'googledrive'], label: 'Google Drive', endpoint: 'gdrive', hosts: /(?:drive|docs)\.google\.com/i, example: 'https://drive.google.com/file/d/xxxx/view', emoji: '☁️' });
