/**
 * Quote - random quote (offline list, no API)
 */
const QUOTES = [
  ['Talk is cheap. Show me the code.', 'Linus Torvalds'],
  ['Premature optimization is the root of all evil.', 'Donald Knuth'],
  ['Make it work, make it right, make it fast.', 'Kent Beck'],
  ['The best way to predict the future is to invent it.', 'Alan Kay'],
  ['Code is like humor. When you have to explain it, it’s bad.', 'Cory House'],
  ['I think, therefore I am.', 'René Descartes'],
  ['The unexamined life is not worth living.', 'Socrates'],
  ['Imagination is more important than knowledge.', 'Albert Einstein'],
  ['Knowledge is power.', 'Francis Bacon'],
  ['A journey of a thousand miles begins with a single step.', 'Lao Tzu'],
  ['The only thing we have to fear is fear itself.', 'Franklin D. Roosevelt'],
  ['That which does not kill us makes us stronger.', 'Friedrich Nietzsche'],
  ['You miss 100% of the shots you don’t take.', 'Wayne Gretzky'],
  ['Fall seven times, stand up eight.', 'Japanese proverb'],
  ['The only way to do great work is to love what you do.', 'Steve Jobs']
];

module.exports = {
  name: 'quote',
  aliases: ['quotes', 'inspire', 'motivation'],
  category: 'fun',
  description: 'Get a random quote',
  usage: '.quote',
  async execute(sock, msg, args, extra) {
    const [q, a] = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    await extra.reply(`💬 _“${q}”_\n\n— *${a}*`);
  }
};
