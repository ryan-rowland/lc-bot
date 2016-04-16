'use strict';

const Brain = require('./brain');

const privateScopes = new WeakMap();
const _ = function(parentReference) {
  return privateScopes.get(parentReference);
};

/**
 * Buys lending club notes for loans that match specific filters.
 * @constructor
 * @param {String} apiKey - LendingClub API key
 * @param {Number} investorId - LendingClub investor ID
 * @param {Array<LoanFilter>} filters - A sorted array of loan
 *   filters to use to buy notes with.
 *//**
 * Returns a note amount to purchase of the specified loan, in USD.
 * @callback LoanFilter
 * @param {Object} loan
 * @returns {Number} amount
 */
function LendingBot(apiKey, investorId, filters, options) {
  if (!(this instanceof LendingBot)) {
    return new LendingBot(apiKey, investorId, filters, options);
  }

  options = options || { };
  let brain = options.brain || new Brain(apiKey, investorId, filters);
  privateScopes.set(this, brain);

  brain.on('connected', (accountSummary) => {
    console.info('Logged in as investor', investorId);
    console.info('Available cash: $' + accountSummary.availableCash);
    console.info('Account total: $' + accountSummary.accountTotal);
  });
}

LendingBot.prototype.buy = function buy(budget) {
  return _(this).connect().then(() => _(this).buy(budget));
};

module.exports = LendingBot;

