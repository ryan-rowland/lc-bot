const credentials = require('./credentials.json')
const LendingBot = require('./lib');

const filter = require('./filters/default');
const bot = new LendingBot(credentials.apiKey, credentials.investorId, filter);

bot.buy()
  .then(results => console.info('200', results))
  .catch(reason => console.info('400', reason));
