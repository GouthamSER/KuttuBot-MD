const { makeBtchCommand } = require('../../utils/btchSend');
module.exports = makeBtchCommand({ name: 'twitter', aliases: ['x', 'twdl', 'xdl', 'tweet'], label: 'Twitter/X', endpoint: 'twitter', hosts: /(?:twitter|x)\.com|t\.co/i, example: 'https://x.com/user/status/123456789', emoji: '🐦' });
