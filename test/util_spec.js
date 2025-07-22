require("node-red-node-test-helper");
const {getDayDifference,isInPeriod} = require("../french-holidays/util");


describe('getDayDifference', function () {
  it('should return correct difference', function () {
    getDayDifference(new Date("2024-11-04"), new Date("2024-11-05")).should.equal(1);
  });
  it('should return correct difference', function () {
    ("-> "+getDayDifference(new Date(2024,11,4,1,5,0,0), new Date(2024,11,5,0,0,0,0)))
    getDayDifference(new Date(2024,11,4,1,5,0,0), new Date(2024,11,5,0,0,0,0)).should.equal(1);
  });
});

describe('isInPeriod', function () {
  it('should return true', function () {
    isInPeriod(new Date("2024-11-04"),new Date("2024-11-03"), new Date("2024-11-05")).should.equal(true);
    isInPeriod(new Date("2024-11-03"),new Date("2024-11-03"), new Date("2024-11-05")).should.equal(true);
    isInPeriod(new Date("2024-11-05"), new Date("2024-11-03"), new Date("2024-11-05")).should.equal(true);
  
  });

  it('should return false', function () {
    isInPeriod(new Date("2024-11-01"), new Date("2024-11-03"), new Date("2024-11-05")).should.equal(false);
    isInPeriod(new Date("2024-11-06"), new Date("2024-11-03"), new Date("2024-11-05")).should.equal(false);
    isInPeriod(new Date("2024-11-04"), new Date("2024-10-24"), new Date("2024-11-03")).should.equal(false);
  });
});
