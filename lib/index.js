'use strict';

const Api = require('lc-api');
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;
const Schedule = require('node-schedule');
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
  _(this).notesByLoan = new Map();
  _(this).sieve = options.sieve || new Sieve(filters);

  Schedule.scheduleJob('30 59 05,09,13,17,21 * * *', () => {
    this.emit('setupStart');

    if (!_(this).autoBuy) { return; }

    this.mapNotesByLoan().then(notesByLoan => {
      _(this).notesByLoanId = notesByLoan;
      this.emit('setupEnd');
    });
  });

  Schedule.scheduleJob('00 00 06,10,14,18,22 * * *', () => {
    this.emit('buyStart');

    if (!_(this).autoBuy) { return; }

    this.buy().then(boughtNotes => {
      this.emit('buyEnd', boughtNotes);
    });
  });

  EventEmitter.call(this);
}

inherits(LendingBot, EventEmitter);

LendingBot.prototype.start = function start() {
  _(this).autoBuy = true;
};

LendingBot.prototype.stop = function stop() {
  _(this).autoBuy = false;
};

LendingBot.prototype.mapNotesByLoan = function() {
  return _(this).api.account.getNotes().then(notes => {
    const notesByLoanId = new Map();

    notes.forEach((note) => {
      if (!notesByLoanId.has(note.LoanId)) {
        notesByLoanId.set(note.LoanId, []);
      }

      notesByLoanId.get(note.LoanId).push(note);
    });

    return notes;
  });
};

LendingBot.prototype.getSummary = function getSummary() {
  return _(this).api.account.getSummary()
    .then(summary => {
      this.emit('summary', summary);
      return summary;
    });
};

LendingBot.prototype.buy = function buy() {
  return this.getSummary().then(summary => {
    const budget = summary.availableCash;
    const loanIds = _(this).notesByLoanId;

    return _(this).api.loans.getNewListings()
      .then(loans => _(this).sieve.apply(loans, budget))
      .then(orders => orders.filter(order => !loanIds.has(order.loanId)))
      .then(orders => _(this).api.account.submitOrders(orders));
  });
};

module.exports = LendingBot;

