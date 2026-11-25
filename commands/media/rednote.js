const { makeBtchCommand } = require('../../utils/btchSend');
module.exports = makeBtchCommand({ name: 'rednote', aliases: ['xhs', 'xiaohongshu', 'redbook'], label: 'RedNote', endpoint: 'xiaohongshu', hosts: /xiaohongshu\.com|xhslink\.com/i, example: 'https://www.xiaohongshu.com/explore/xxxx', emoji: '📕' });
