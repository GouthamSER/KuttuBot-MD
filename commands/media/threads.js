const { makeBtchCommand } = require('../../utils/btchSend');
module.exports = makeBtchCommand({ name: 'threads', aliases: ['threadsdl'], label: 'Threads', endpoint: 'threads', hosts: /threads\.(?:net|com)/i, example: 'https://www.threads.net/@user/post/xxxx', emoji: '🧵' });
