const { makeBtchCommand } = require('../../utils/btchSend');
module.exports = makeBtchCommand({ name: 'mediafire', aliases: ['mf', 'mfdl', 'mediafiredl'], label: 'MediaFire', endpoint: 'mediafire', hosts: /mediafire\.com/i, example: 'https://www.mediafire.com/file/xxxx/file.zip', emoji: '📁' });
