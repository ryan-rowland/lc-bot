const credentials = require('./credentials.json')
const LendingBot = require('./lib');

const filter = require('./filters/default');
const bot = new LendingBot(credentials.apiKey, credentials.investorId, filter);

function log(message) {
  const now = new Date();
  console.info(`[${now.toLocaleString()}]`, message);
}

bot.on('setupStart', () => log('Set-up time...'));
bot.on('setupEnd', () => log('Set-up finished.'));
bot.on('buyStart', () => log('Feeding time...'));
bot.on('buyEnd', (notes) => log(`Buy finished. Bought ${notes.length} notes.`));
bot.on('summary', (summary) => log(`Summary received. Available balance: $${summary.availableCash}`));

log(`Starting LC-Bot for investor ${credentials.investorId}...`);
bot.getSummary();
bot.start();

