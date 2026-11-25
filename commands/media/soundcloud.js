const { makeBtchCommand } = require('../../utils/btchSend');
module.exports = makeBtchCommand({ name: 'soundcloud', aliases: ['scdl', 'sclouddl', 'sndcloud'], label: 'SoundCloud', endpoint: 'soundcloud', hosts: /soundcloud\.com|snd\.sc/i, example: 'https://soundcloud.com/artist/track', emoji: '🎧' });
