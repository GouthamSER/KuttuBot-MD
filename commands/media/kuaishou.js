const { makeBtchCommand } = require('../../utils/btchSend');
module.exports = makeBtchCommand({ name: 'kuaishou', aliases: ['ks', 'kwai', 'kuaishoudl'], label: 'Kuaishou', endpoint: 'kuaishou', hosts: /kuaishou\.com|kwai\.com|chenzhongtech\.com/i, example: 'https://v.kuaishou.com/xxxx', emoji: '⚡' });
