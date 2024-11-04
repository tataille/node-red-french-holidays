/***
 * Business methods
 */

const { isInPeriod, getDayDifference,sortDates } = require("./util");
const {LOCALE_CODE} =require("./constant")

/**
 * Computes the school holiday status for the given day and updates the result object.
 *
 * @param {Date} day - The current day to check for school holiday status.
 * @param {Object} record - The school holiday record containing start_date, end_date, zones, and description.
 * @param {Object} result - The result object to be updated with holiday information.
 * @property {boolean} result.isSchoolHolidays - True if the current day is a school holiday.
 * @property {string} result.schoolHolidaysName - The name of the current school holiday.
 * @property {string} result.schoolHolidaysEndDate - The end date of the current school holiday.
 * @property {boolean} result.isTomorrowSchoolHolidays - True if the next day is a school holiday.
 * @property {string} result.nextHolidayName - The name of the next school holiday period.
 * @property {number} result.daysDifference - The number of days until the next school holiday.
 * @property {string} result.startDate - The start date of the next school holiday period.
 * @property {string} result.endDate - The end date of the next school holiday period.
 * @property {string} result.zones - The academic zones applicable to the holiday.
 * @returns {Object} The updated result object containing school holiday information.
 */
function computeSchoolHoliday(day,record, result) {
  var tomorrowDate = new Date(day);
  tomorrowDate.setDate(day.getDate() + 1);
  const start_date = new Date(Date.parse(record.start_date))
  const end_date =  new Date(Date.parse(record.end_date))

  result.zones = record.zones
  if (isInPeriod(day, start_date, end_date)) {
    //Today
    result.isSchoolHolidays = true
    result.schoolHolidaysName = record.description
    result.schoolHolidaysEndDate = end_date.toLocaleDateString(LOCALE_CODE)
  } 
  if (isInPeriod(tomorrowDate, start_date, end_date)) {
    //tomorrow
    result.isTomorrowSchoolHolidays = true
    result.schoolHolidaysName = record.description
    result.schoolHolidaysEndDate = end_date.toLocaleDateString(LOCALE_CODE)
  } else {
    //next holidays
    const diff = getDayDifference(day, start_date)
    if (diff > 0 && !result.nextHolidayName) {
      result.nextHolidayName = record.description
      result.daysDifference = getDayDifference(day, start_date)
      result.startDate = start_date.toLocaleDateString(LOCALE_CODE)
      result.endDate = end_date.toLocaleDateString(LOCALE_CODE)
    }
  }
  return result;
}

/**
 * @function retrieveSchoolPeriod
 * @description Return the current school period based on the given date.
 *              In France, the school year starts in September and ends in June.
 *              The school year is named after the starting year.
 * @param {Date} currentDate - The date to determine the school period from.
 * @returns {number} - The year of the school period.
 */
function retrieveSchoolPeriod(currentDate) {
  var currentMonth = currentDate.getMonth()
  if (currentMonth <= 7) {
    beginningYear = currentDate.getFullYear() - 1
  }
  else {
    beginningYear = currentDate.getFullYear()
  }
  return beginningYear
}

/**
 * @function computePublicHoliday
 * @description Compute the public holiday information for a given date and
 *              the next day. The information is stored in the result object.
 * @param {String} TODAY_DATE - The date string (format: YYYY-MM-DD) of the current day.
 * @param {String} TOMORROW_DATE - The date string (format: YYYY-MM-DD) of the next day.
 * @param {Object} records - The public holiday records containing date and name information.
 * @param {Object} result - The result object to be updated with public holiday information.
 * @property {boolean} result.isPublicHoliday - True if the current day is a public holiday.
 * @property {string} result.publicHolidayName - The name of the public holiday.
 * @property {boolean} result.isTomorrowPublicHoliday - True if the next day is a public holiday.
 * @property {string} result.nextPublicHolidayName - The name of the next public holiday.
 * @property {string} result.nextPublicHolidayDate - The date of the next public holiday.
 * @returns {Object} The updated result object containing public holiday information.
 */
function computePublicHoliday(TODAY_DATE,TOMORROW_DATE,records, result) {
  records = sortDates(records)
  const kdates = Object.keys(records)

  let fresult=kdates.find(f=>f===TODAY_DATE)
  if(fresult){
      result.isPublicHoliday = true
      result.publicHolidayName = records[TODAY_DATE]
  }

  fresult=kdates.find(f=>f===TOMORROW_DATE)
  if(fresult){
      result.isTomorrowPublicHoliday = true
  }

  fresult=kdates.find(f=>new Date(f).getTime()> new Date(TODAY_DATE).getTime())
  if(fresult){
    result.nextPublicHolidayDate = new Date(fresult).toLocaleDateString(LOCALE_CODE)
    result.nextPublicHolidayName = records[fresult]
  }

  return result;
}


module.exports = {
  computeSchoolHoliday: computeSchoolHoliday,
  retrieveSchoolPeriod: retrieveSchoolPeriod,
  computePublicHoliday:computePublicHoliday
}