'use strict';

const Api = require('lc-api');
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;
const unionBy = require('lodash.unionby');

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
function Brain(apiKey, investorId, filters) {
  EventEmitter.call(this);

  const api = this.api = new Api(apiKey, investorId);

  this.apiKey = apiKey;
  this.investorId = investorId;

  filters = filters || [];
  this.filters = filters.forEach ? filters : [filters];

  let connectPromise = api.account.getSummary()
    .then((summary) => this.initialize(summary))
    .catch((reason) => Brain.handleError(reason));

  this.connect = () => connectPromise;
}

inherits(Brain, EventEmitter);

Brain.handleError = function handleError(reason) {
  if (reason.statusCode === 401) {
    reason = '401 | Unable to authenticate';
  }

  return console.error(reason.message || reason);
};

Brain.createOrders = function createOrders(loans, filter) {
  return loans.map((loan) => {
    const noteAmount = filter(loan);
    return loan.createOrder(noteAmount);
  }).filter(order => order.requestedAmount >= 25);
};

Brain.trimOrdersToBudget = function trimOrdersToBudget(orders, budget) {
  return orders.reduce((selected, order) => {
    const amount = order.requestedAmount;

    if (amount <= budget) {
      budget -= amount;
      selected.push(order);
    }

    return selected;
  }, []);
};

Brain.prototype.initialize = function initialize(accountSummary) {
  this.summary = accountSummary;
  this.emit('connected', accountSummary);
};

Brain.prototype.buy = function buy(budget) {
  budget = (typeof budget === 'number') ? budget : this.summary.availableCash;
  
  return this.api.loans.getNewListings().then(loans => {
    let orders = this.filters.map(Brain.createOrders.bind(null, loans))

    orders = unionBy.apply(null, orders.concat(['loanId']));
    orders = Brain.trimOrdersToBudget(orders, budget);

    return this.api.account.submitOrders(orders);
  });
};

module.exports = Brain;

