/***
 * Business methods
 */

const { isInPeriod, getDayDifference,sortDates } = require("./util");
const {LOCALE_CODE} =require("./constant")

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
    if (diff > 0) {
      result.nextHolidayName = record.description
      result.daysDifference = getDayDifference(day, start_date)
      result.startDate = start_date.toLocaleDateString(LOCALE_CODE)
      result.endDate = end_date.toLocaleDateString(LOCALE_CODE)
    }
  }
  return result;
}

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