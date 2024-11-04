module.exports = function (RED) {
  const https = require('https')
  const { displayErrorMsg } = require("./util")
  const { retrieveSchoolPeriod, computePublicHoliday, computeSchoolHoliday } = require("./business")
  const { version } = require('../package.json');
  const { GEO_MAP } = require("./constant")


  function retrieveFrenchHoliday(config) {
    //retrieve day number
    RED.nodes.createNode(this, config)
    this.academy = config.academy
    this.geo = config.geo
    var node = this

    node.on('input', function (msg, send, done) {
      const TODAY = new Date()
      const CURRENT_YEAR = TODAY.getFullYear();
      var TOMORROW = new Date(TODAY);
      TOMORROW.setDate(TODAY.getDate() + 1);

      const TOMORROW_DATE = TOMORROW.toISOString().split('T')[0];
      const TODAY_DATE = TODAY.toISOString().split('T')[0];

      const beginningYear = retrieveSchoolPeriod(TODAY)
      const endYear = beginningYear + 1
      //console.log(`- School Period >>> ${beginningYear}-${endYear}`)

      const PUBLIC_HOLIDAY_API = `https://calendrier.api.gouv.fr/jours-feries/${GEO_MAP[this.geo]}.json`
      const FULL_SCHOOL_CALENDAR_API = `https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-calendrier-scolaire&q=&rows=100&facet=description&facet=start_date&facet=end_date&facet=location&facet=zones&refine.location=${this.academy}&refine.annee_scolaire=${beginningYear}-${endYear}`

      const promisePublicHoliday = new Promise(function (resolve, reject) {
        https
          .get(PUBLIC_HOLIDAY_API, res => {
            let body = ''
            res.on('data', chunk => {
              body += chunk
            })

            res.on('end', () => {
              try {
                var holidayJson = JSON.parse(body)
                console.log("# promisePublicHoliday Response: " + body)
                if (holidayJson) {
                  let result = {
                    day: TODAY.getDay(),
                    isPublicHoliday: false,
                    isTomorrowPublicHoliday: false,
                    publicHolidayName: undefined,
                    nextPublicHolidayName: undefined,
                    nextPublicHolidayDate: undefined,
                    year: CURRENT_YEAR
                  }
                  resolve(computePublicHoliday(TODAY_DATE, TOMORROW_DATE, holidayJson, result))
                } else {
                  displayErrorMsg("Public Holiday API returns no record")
                  reject({ message: "Public Holiday API returns no record" })
                }

              } catch (error) {
                if (done) {
                  // Node-RED 1.0 compatible
                  done(error);
                } else {
                  // Node-RED 0.x compatible
                  node.error(error, msg);
                }
                reject(error)
              }
            })
              .on('error', error => {
                displayErrorMsg(error.message)
                if (done) {
                  // Node-RED 1.0 compatible
                  done(error);
                } else {
                  // Node-RED 0.x compatible
                  node.error(error, msg);
                }
                reject(error)
              })
          })
      })
      const promiseEntireSchoolHolidaysCalendar = new Promise(function (resolve, reject) {
        https
          .get(FULL_SCHOOL_CALENDAR_API, res => {
            let body = ''

            res.on('data', chunk => {
              body += chunk
            })

            res.on('end', () => {
              try {
                var holidayJson = JSON.parse(body)
                console.log("# promiseEntireSchoolHolidaysCalendar Response: " + body)
                var records = holidayJson.records.sort((a, b) => new Date(a.fields.start_date) - new Date(b.fields.start_date))

                var result = {
                  isSchoolHolidays: false,
                  schoolHolidaysName: undefined,
                  schoolHolidaysEndDate: undefined,
                  isTomorrowSchoolHolidays: false,
                  nextHolidayName: undefined,
                  daysDifference: -1,
                  startDate: undefined,
                  endDate: undefined,
                  zones: undefined,
                }

                if (records) {
                  for (let i = 0; i < records.length; i++) {
                    result = computeSchoolHoliday(TODAY, records[i].fields, result)
                  }

                  //console.log("- daysDifference: " + result.daysDifference)
                  //console.log("- nextHolidayName  : " + result.nextHolidayName)

                  resolve(result)
                } else {
                  displayErrorMsg("School Holiday API for the whole year is returning no records")
                  reject({ message: "School Holiday API for the whole year is returning no records" })
                }
              } catch (error) {
                if (done) {
                  // Node-RED 1.0 compatible
                  done(error);
                } else {
                  // Node-RED 0.x compatible
                  node.error(error, msg);
                }
                reject(error)
              }
            })
              .on('error', error => {
                displayErrorMsg(error.message)
                if (done) {
                  // Node-RED 1.0 compatible
                  done(error);
                } else {
                  // Node-RED 0.x compatible
                  node.error(error, msg);
                }
                reject(error)
              })
          })
      })

      Promise.all([promisePublicHoliday, promiseEntireSchoolHolidaysCalendar])
        .then((values) => {
          result = {
            day: TODAY.getDay(),
            isPublicHoliday: values[0].isPublicHoliday,
            isTomorrowPublicHoliday: values[0].isTomorrowPublicHoliday,
            publicHolidayName: values[0].publicHolidayName,
            nextPublicHolidayName: values[0].nextPublicHolidayName,
            nextPublicHolidayDate: values[0].nextPublicHolidayDate,
            isSchoolHolidays: values[1].isSchoolHolidays,
            isTomorrowSchoolHolidays: values[1].isTomorrowSchoolHolidays,
            schoolHolidaysName: values[1].schoolHolidaysName,
            schoolHolidaysEndDate: values[1].schoolHolidaysEndDate,
            nextSchoolHolidaysCoutdownInDays: values[1].daysDifference,
            nextSchoolHolidaysName: values[1].nextHolidayName,
            nextSchoolHolidaysStartDate: values[1].startDate,
            nextSchoolHolidaysEndDate: values[1].endDate,
            schoolPeriod: beginningYear + '-' + endYear,
            year: CURRENT_YEAR,
            region: this.geo,
            academy: this.academy,
            zones: values[1].zones,
            version: version
          }
          msg.payload = result
          node.send(msg)
        }).catch((error) => {
          console.error(error.message);
        });
    })
  }
  RED.nodes.registerType('french-holidays', retrieveFrenchHoliday)
}
