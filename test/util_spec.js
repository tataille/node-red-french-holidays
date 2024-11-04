require("node-red-node-test-helper");
const {toISOLocal,getDayDifference,isInPeriod} = require("../french-holidays/util");

describe('toISOLocal', function () {
  it('should be convert Date', function () {

    const testDate= new Date("2024-11-04")
    const expected="2024-11-04T00:00:00.000-00:00"

    toISOLocal(testDate).should.equal(expected);
  });
});

describe('getDayDifference', function () {
  it('should return correct difference', function () {
    getDayDifference(new Date("2024-11-04"), new Date("2024-11-05")).should.equal(1);
  });
});

describe('isInPeriod', function () {
  it('should return true', function () {
    isInPeriod(new Date("2024-11-04"),new Date("2024-11-03"), new Date("2024-11-05")).should.equal(true);
    isInPeriod(new Date("2024-11-03"),new Date("2024-11-03"), new Date("2024-11-05")).should.equal(true);
    isInPeriod(new Date("2024-11-05"),new Date("2024-11-03"), new Date("2024-11-05")).should.equal(true);

  });

  it('should return false', function () {
    isInPeriod(new Date("2024-11-01"),new Date("2024-11-03"), new Date("2024-11-05")).should.equal(false);
  });
});
