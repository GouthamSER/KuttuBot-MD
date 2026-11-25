const { makeBtchCommand } = require('../../utils/btchSend');
module.exports = makeBtchCommand({ name: 'aio', aliases: ['aiodl', 'alldl', 'anydl', 'allinone'], label: 'Any link', endpoint: 'aio', hosts: null, example: 'https://<any supported site link>', emoji: '🌐' });
