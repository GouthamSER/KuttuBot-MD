const { makeBtchCommand } = require('../../utils/btchSend');
module.exports = makeBtchCommand({ name: 'capcut', aliases: ['cc', 'capcutdl'], label: 'CapCut', endpoint: 'capcut', hosts: /capcut\.com/i, example: 'https://www.capcut.com/t/xxxx/', emoji: '🎞️' });
