'use strict';

const unionBy = require('lodash.unionby');

/**
 * Applies an ordered array of filters to a list of loans.
 * @constructor
 * @param {Array<LoanFilter>} filters - A sorted array of loan filters to use to buy
 *   notes with. Filters hould be ordered by highest precedence (index zero) to
 *   lowest precedence.
 *//**
 * Returns a note amount to purchase of the specified loan, in USD.
 * @callback LoanFilter
 * @param {Object} loan
 * @returns {Number} amount
 */
function Sieve(filters) {
  filters = filters || [];
  this.filters = filters.forEach ? filters : [filters];
}

/**
 * Apply the list of filters to a set of loans.
 * @param {Array<Loan>} loans - The array of loans to filter.
 * @param {Number} budget - The maximum amount of USD to distrubute
 *   between matching notes.
 * @return {Array<Order>} orders
 */
Sieve.prototype.apply = function apply(loans, budget) {
  const ordersByFilter = this.filters.map(filter => Sieve.createOrders(loans, filter));
  console.info(ordersByFilter);
  const orders = unionBy.apply(null, ordersByFilter.concat(['loanId']));
  console.info(orders);
  return Sieve.trimOrdersToBudget(orders, budget);
};

Sieve.createOrders = function createOrders(loans, filter) {
  return loans.map((loan) => {
    const noteAmount = filter(loan);
    return loan.createOrder(noteAmount);
  }).filter(order => order.requestedAmount >= 25);
};

Sieve.trimOrdersToBudget = function trimOrdersToBudget(orders, budget) {
  return orders.reduce((selected, order) => {
    const amount = order.requestedAmount;

    if (amount <= budget) {
      budget -= amount;
      selected.push(order);
    }

    return selected;
  }, []);
};

module.exports = Sieve;

