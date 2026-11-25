const { makeBtchCommand } = require('../../utils/btchSend');
module.exports = makeBtchCommand({ name: 'snackvideo', aliases: ['snack', 'snackdl'], label: 'SnackVideo', endpoint: 'snackvideo', hosts: /snackvideo\.com|sck\.io/i, example: 'https://www.snackvideo.com/@user/video/xxxx', emoji: '🍿' });
