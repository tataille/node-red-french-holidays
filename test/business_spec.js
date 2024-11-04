
const { computeSchoolHoliday, retrieveSchoolPeriod, computePublicHoliday } = require("../french-holidays/business");
const {toISOLocal}=require("../french-holidays/util")
require("node-red-node-test-helper");

describe('computeSchoolHoliday', function () {
  it('should be holidays', function () {
    const RECORD = {
      start_date: "2024-11-01",
      end_date: "2024-11-10",
      zones: "C",
      description: "description"
    }
    const result = computeSchoolHoliday(new Date("2024-11-10"), RECORD, {
      isSchoolHolidays: false,
      schoolHolidaysName: undefined,
      schoolHolidaysEndDate: undefined,
      isTomorrowSchoolHolidays: false,
      nextHolidayName: undefined,
      daysDifference: -1,
      startDate: undefined,
      endDate: undefined,
      zones: undefined,
    })

    result.isSchoolHolidays.should.equal(true);
    result.schoolHolidaysName.should.equal("description");
    result.schoolHolidaysEndDate.should.equal('10/11/2024');

    result.isTomorrowSchoolHolidays.should.equal(false);

    should.not.exist(result.nextHolidayName);
    result.daysDifference.should.equal(-1);
  });

  it('should be holidays & tomorrow', function () {
    const RECORD = {
      start_date: "2024-11-01",
      end_date: "2024-11-10",
      zones: "C",
      description: "description"
    }
    const result = computeSchoolHoliday(new Date("2024-11-04"), RECORD, {
      isSchoolHolidays: false,
      schoolHolidaysName: undefined,
      schoolHolidaysEndDate: undefined,
      isTomorrowSchoolHolidays: false,
      nextHolidayName: undefined,
      daysDifference: -1,
      startDate: undefined,
      endDate: undefined,
      zones: undefined,
    })

    result.isSchoolHolidays.should.equal(true);
    result.schoolHolidaysName.should.equal("description");
    result.schoolHolidaysEndDate.should.equal('10/11/2024');

    result.isTomorrowSchoolHolidays.should.equal(true);

    should.not.exist(result.nextHolidayName);
    result.daysDifference.should.equal(-1);
  });

  it('should be next holidays', function () {
    const RECORD = {
      start_date: "2024-11-01",
      end_date: "2024-11-10",
      zones: "C",
      description: "description"
    }
    const result = computeSchoolHoliday(new Date("2024-10-04"), RECORD, {
      isSchoolHolidays: false,
      schoolHolidaysName: undefined,
      schoolHolidaysEndDate: undefined,
      isTomorrowSchoolHolidays: false,
      nextHolidayName: undefined,
      daysDifference: -1,
      startDate: undefined,
      endDate: undefined,
      zones: undefined,
    })

    result.isSchoolHolidays.should.equal(false);
    should.not.exist(result.schoolHolidaysName);
    should.not.exist(result.schoolHolidaysEndDate);

    result.isTomorrowSchoolHolidays.should.equal(false);

    result.nextHolidayName.should.equal("description");
    result.daysDifference.should.equal(28);
  });

  it('should be not holidays', function () {
    const RECORD = {
      start_date: "2024-11-01",
      end_date: "2024-11-10",
      zones: "C",
      description: "description"
    }
    const result = computeSchoolHoliday(new Date("2024-12-04"), RECORD, {
      isSchoolHolidays: false,
      schoolHolidaysName: undefined,
      schoolHolidaysEndDate: undefined,
      isTomorrowSchoolHolidays: false,
      nextHolidayName: undefined,
      daysDifference: -1,
      startDate: undefined,
      endDate: undefined,
      zones: undefined,
    })

    result.isSchoolHolidays.should.equal(false);
    should.not.exist(result.schoolHolidaysName);
    should.not.exist(result.schoolHolidaysEndDate);

    result.isTomorrowSchoolHolidays.should.equal(false);

    should.not.exist(result.nextHolidayName);
    result.daysDifference.should.equal(-1);
  });
});


describe('retrieveSchoolPeriod', function () {
  it('should return 2024', function () {
    retrieveSchoolPeriod(new Date("2024-11-04")).should.equal(2024);
  });

  it('should return 2024', function () {
    retrieveSchoolPeriod(new Date("2025-06-04")).should.equal(2024);
  });
});

describe('computePublicHoliday', function () {
  it('should be not public holidays (next fete2)', function () {
    const RECORD = {
      "2024-11-11":"FETE2",
      "2024-11-01":"FETE1"
    }
    const TODAY = new Date("2024-11-05")
    const CURRENT_YEAR = TODAY.getFullYear();
    var TOMORROW = new Date(TODAY);
    TOMORROW.setDate(TODAY.getDate() + 1);

    const TOMORROW_DATE = toISOLocal(TOMORROW).split('T')[0];
    const TODAY_DATE = toISOLocal(TODAY).split('T')[0];

    const result = computePublicHoliday(TODAY_DATE, TOMORROW_DATE, RECORD, {
      day: TODAY.getDay(),
      isPublicHoliday: false,
      isTomorrowPublicHoliday: false,
      publicHolidayName: undefined,
      nextPublicHolidayName: undefined,
      nextPublicHolidayDate: undefined,
      year: CURRENT_YEAR
    })
    console.log(result)
    result.isPublicHoliday.should.equal(false);
    result.isTomorrowPublicHoliday.should.equal(false);
    should.not.exist(result.publicHolidayName);
    result.nextPublicHolidayName.should.equal("FETE2");
    result.nextPublicHolidayDate.should.equal('11/11/2024');
  });

  it('should be not public holidays (next fete1)', function () {
    const RECORD = {
      "2024-11-11":"FETE2",
      "2024-11-01":"FETE1"
    }
    const TODAY = new Date("2024-10-05")
    const CURRENT_YEAR = TODAY.getFullYear();
    var TOMORROW = new Date(TODAY);
    TOMORROW.setDate(TODAY.getDate() + 1);

    const TOMORROW_DATE = toISOLocal(TOMORROW).split('T')[0];
    const TODAY_DATE = toISOLocal(TODAY).split('T')[0];

    const result = computePublicHoliday(TODAY_DATE, TOMORROW_DATE, RECORD, {
      day: TODAY.getDay(),
      isPublicHoliday: false,
      isTomorrowPublicHoliday: false,
      publicHolidayName: undefined,
      nextPublicHolidayName: undefined,
      nextPublicHolidayDate: undefined,
      year: CURRENT_YEAR
    })

    result.isPublicHoliday.should.equal(false);
    result.isTomorrowPublicHoliday.should.equal(false);
    should.not.exist(result.publicHolidayName);
    result.nextPublicHolidayName.should.equal("FETE1");
    result.nextPublicHolidayDate.should.equal('01/11/2024');
  });

  it('should be public holidays', function () {
    const RECORD = {
      "2024-11-11":"FETE2",
      "2024-11-01":"FETE1"
    }
    const TODAY = new Date("2024-11-01")
    const CURRENT_YEAR = TODAY.getFullYear();
    var TOMORROW = new Date(TODAY);
    TOMORROW.setDate(TODAY.getDate() + 1);

    const TOMORROW_DATE = toISOLocal(TOMORROW).split('T')[0];
    const TODAY_DATE = toISOLocal(TODAY).split('T')[0];

    const result = computePublicHoliday(TODAY_DATE, TOMORROW_DATE, RECORD, {
      day: TODAY.getDay(),
      isPublicHoliday: false,
      isTomorrowPublicHoliday: false,
      publicHolidayName: undefined,
      nextPublicHolidayName: undefined,
      nextPublicHolidayDate: undefined,
      year: CURRENT_YEAR
    })

    result.isPublicHoliday.should.equal(true);
    result.isTomorrowPublicHoliday.should.equal(false);
    result.publicHolidayName.should.equal("FETE1");
    result.nextPublicHolidayName.should.equal("FETE2");
    result.nextPublicHolidayDate.should.equal( '11/11/2024');
  });

  it('should be public holidays tomorrow', function () {
    const RECORD = {
      "2024-11-11":"FETE2",
      "2024-11-01":"FETE1"
    }
    const TODAY = new Date("2024-11-10")
    const CURRENT_YEAR = TODAY.getFullYear();
    var TOMORROW = new Date(TODAY);
    TOMORROW.setDate(TODAY.getDate() + 1);

    const TOMORROW_DATE = toISOLocal(TOMORROW).split('T')[0];
    const TODAY_DATE = toISOLocal(TODAY).split('T')[0];

    const result = computePublicHoliday(TODAY_DATE, TOMORROW_DATE, RECORD, {
      day: TODAY.getDay(),
      isPublicHoliday: false,
      isTomorrowPublicHoliday: false,
      publicHolidayName: undefined,
      nextPublicHolidayName: undefined,
      nextPublicHolidayDate: undefined,
      year: CURRENT_YEAR
    })

    result.isPublicHoliday.should.equal(false);
    result.isTomorrowPublicHoliday.should.equal(true);
    should.not.exist(result.publicHolidayName);
    result.nextPublicHolidayName.should.equal("FETE2");
    result.nextPublicHolidayDate.should.equal( '11/11/2024');
  });

  it('should be never public holidays', function () {
    const RECORD = {
      "2024-11-11":"FETE2",
      "2024-11-01":"FETE1"
    }
    const TODAY = new Date("2024-11-30")
    const CURRENT_YEAR = TODAY.getFullYear();
    var TOMORROW = new Date(TODAY);
    TOMORROW.setDate(TODAY.getDate() + 1);

    const TOMORROW_DATE = toISOLocal(TOMORROW).split('T')[0];
    const TODAY_DATE = toISOLocal(TODAY).split('T')[0];

    const result = computePublicHoliday(TODAY_DATE, TOMORROW_DATE, RECORD, {
      day: TODAY.getDay(),
      isPublicHoliday: false,
      isTomorrowPublicHoliday: false,
      publicHolidayName: undefined,
      nextPublicHolidayName: undefined,
      nextPublicHolidayDate: undefined,
      year: CURRENT_YEAR
    })

    result.isPublicHoliday.should.equal(false);
    result.isTomorrowPublicHoliday.should.equal(false);
    should.not.exist(result.publicHolidayName);
    should.not.exist(result.nextPublicHolidayName);
    should.not.exist(result.nextPublicHolidayDate);
  });
})
