const { makeBtchCommand } = require('../../utils/btchSend');
module.exports = makeBtchCommand({ name: 'cocofun', aliases: ['coco', 'cocodl'], label: 'CocoFun', endpoint: 'cocofun', hosts: /cocofun\.com|icocofun\.com/i, example: 'https://www.icocofun.com/share/post/xxxx', emoji: '😂' });
