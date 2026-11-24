/**
 * Would You Rather - random prompt (offline list)
 */
const WYR = [
  ['be able to fly', 'be invisible'],
  ['always be 10 minutes late', 'always be 20 minutes early'],
  ['have unlimited internet but slow speed', 'have 5 GB of super-fast internet per month'],
  ['lose your phone for a week', 'lose your wallet for a week'],
  ['know how you will die', 'know when you will die'],
  ['live without music', 'live without movies'],
  ['be a great programmer', 'be a great musician'],
  ['only eat biryani for a year', 'never eat biryani again'],
  ['travel to the past', 'travel to the future'],
  ['have a personal robot', 'have a personal chef'],
  ['never use social media again', 'never watch videos again'],
  ['be famous but broke', 'be rich but unknown'],
  ['speak every language', 'play every instrument'],
  ['live on the beach', 'live in the mountains'],
  ['have no exams ever', 'have no homework ever']
];

module.exports = {
  name: 'wyr',
  aliases: ['wouldyourather', 'rather'],
  category: 'fun',
  description: 'Would you rather question',
  usage: '.wyr',
  async execute(sock, msg, args, extra) {
    const [a, b] = WYR[Math.floor(Math.random() * WYR.length)];
    await extra.reply(`🤔 *Would you rather...*\n\n🅰️ ${a}\n\n*or*\n\n🅱️ ${b}\n\n_Reply with A or B!_`);
  }
};
