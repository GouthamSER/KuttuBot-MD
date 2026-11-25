const { makeBtchCommand } = require('../../utils/btchSend');
module.exports = makeBtchCommand({ name: 'douyin', aliases: ['dy', 'douyindl'], label: 'Douyin', endpoint: 'douyin', hosts: /douyin\.com|iesdouyin\.com/i, example: 'https://v.douyin.com/xxxx/', emoji: '🎵' });
