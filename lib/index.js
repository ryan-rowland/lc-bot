'use strict';

const Api = require('lc-api');
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;
const Sieve = require('./sieve');

const privateScopes = new WeakMap();
const _ = function(key) {
  if (!privateScopes.has(key)) {
    privateScopes.set(key, { });
  }
  return privateScopes.get(key);
};

/**
 * Buys lending club notes for loans that match specific filters.
 * @constructor
 * @param {LCApi} api - LendingClub API instance to use.
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
  _(this).api = options.api || new Api(apiKey, investorId);
  _(this).sieve = options.sieve || new Sieve(filters);

  EventEmitter.call(this);
}

inherits(LendingBot, EventEmitter);

LendingBot.prototype.startAutoBuy = function start() {
  // noop
};

LendingBot.prototype.stopAutoBuy = function stop() {
  // noop
};

LendingBot.prototype.buy = function buy() {
  return _(this).api.account.getSummary().then(summary => {
    const budget = summary.availableCash;

    return _(this).api.loans.getNewListings()
      .then(loans => _(this).sieve.apply(loans, budget))
      .then(orders => _(this).api.account.submitOrders(orders));
  });
};

module.exports = LendingBot;

