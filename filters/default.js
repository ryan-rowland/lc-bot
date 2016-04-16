module.exports = function Filter(loan) {
  if (['E', 'F', 'G'].indexOf(loan.grade) !== -1
    && loan.purpose !== 'small_business'
    && !loan.totCollAmt
    && !loan.delinq2Yrs
    && !loan.mthsSinceLastMajorDerog
    && !loan.inqLast6Mths
    && !loan.pubRec) {
      return 25.00;
  }

  return 0;
};

