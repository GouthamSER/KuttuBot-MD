/**
 * Fact - random fun fact (offline list, no API)
 */
const FACTS = [
  'Octopuses have three hearts.',
  'A day on Venus is longer than a year on Venus.',
  'Bananas are botanically berries, but strawberries are not.',
  'Wombat droppings are cube-shaped.',
  'Sharks are older than trees: they appeared roughly 450 million years ago, trees about 385 million.',
  'Sound cannot travel through the vacuum of space.',
  'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
  'Honey found in ancient Egyptian tombs was still edible — properly sealed honey barely spoils.',
  'The Python language is named after Monty Python, not the snake.',
  'The first computer “bug” was a real moth found in a Harvard Mark II relay in 1947.',
  'A group of flamingos is called a flamboyance.',
  'Antarctica is the largest desert on Earth.',
  'Kerala has the highest literacy rate among Indian states (94% in the 2011 census).',
  'The Anglo-Zanzibar War of 1896 is the shortest recorded war — it lasted under an hour.',
  'Mount Everest grows by about 4 mm every year.',
  'An adult human body has 206 bones.',
  'The Eiffel Tower can be up to ~15 cm taller in summer because the iron expands in heat.',
  'At the triple point, water can exist as ice, liquid and vapour at the same time.'
];

module.exports = {
  name: 'fact',
  aliases: ['funfact', 'randomfact'],
  category: 'fun',
  description: 'Get a random fun fact',
  usage: '.fact',
  async execute(sock, msg, args, extra) {
    await extra.reply(`🧠 *Did you know?*\n\n${FACTS[Math.floor(Math.random() * FACTS.length)]}`);
  }
};
