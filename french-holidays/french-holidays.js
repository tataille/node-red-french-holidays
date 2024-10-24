module.exports = function (RED) {
  const https = require('https')
  
  const { version } = require('../package.json');

  const sortDates = obj =>
    Object.keys(obj)
      .sort()
      .reduce((res, key) => ((res[key] = obj[key]), res), {})

  var currentYear;
  var region;

  var geoMap = {}
  geoMap['Alsace-Moselle'] = 'alsace-moselle'
  geoMap['Guadeloupe'] = 'guadeloupe'
  geoMap['La Réunion'] = 'la-reunion'
  geoMap['Martinique'] = 'martinique'
  geoMap['Mayotte'] = 'mayotte'
  geoMap['Métropole'] = 'metropole'
  geoMap['Nouvelle Calédonie'] = 'nouvelle-caledonie'
  geoMap['Polynésie Française'] = 'polyneise-francaise'
  geoMap['Saint Barthélémy'] = 'saint-barthelemy'
  geoMap['Saint Martin'] = 'saint-martin'
  geoMap['Saint Pierre et Miquelon'] = 'saint-pierre-et-miquelon'
  geoMap['Wallis et Futuna'] = 'wallis-et-futuna'

  function toISOLocal(d) {
    const z = n => ('0' + n).slice(-2);
    let off = d.getTimezoneOffset();
    const sign = off < 0 ? '+' : '-';
    off = Math.abs(off);
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, -1) + sign + z(off / 60 | 0) + ':' + z(off % 60);
  }

  function displayErrorMsg( msg) {
    node.status({fill:"red",shape:"ring",text: msg});
    throw new Error(msg);
  }

  function retrieveSchoolPeriod( currentDate) {
    var currentMonth = currentDate.getMonth()
    currentYear = currentDate.getFullYear()
    if (currentMonth <= 7) {
      beginningYear = currentDate.getFullYear()-1
    }
    else {
      beginningYear = currentDate.getFullYear()
    }
  }

  function retrieveFrenchHoliday (config) {
    //retrieve day number
    RED.nodes.createNode(this, config)
    this.academy = config.academy
    this.geo = config.geo
    var node = this

    node.on('input', function (msg, send, done) {
      var today = new Date()
      var tomorrow = new Date(today);
      
      tomorrow.setDate(today.getDate() + 1);
      tomorrow = toISOLocal(tomorrow).split('T')[0];
      
      retrieveSchoolPeriod(today)

      console.log("- School Period Beginning year >>>"+beginningYear)

      var endYear = beginningYear+1
      console.log("- School Period  End Year r>>>"+endYear)
      var date = toISOLocal(new Date()).split('T')[0]
      var publicHolidayApi =
        'https://calendrier.api.gouv.fr/jours-feries/' + geoMap[this.geo] + '.json'
      var entireSchoolHolidaysCalendarApi = 
      'https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-calendrier-scolaire&q=&rows=100&facet=description&facet=start_date&facet=end_date&facet=location&facet=zones&refine.location='+this.academy+'&refine.annee_scolaire='+beginningYear+'-'+endYear
      var isPublicHoliday = false
      var publicHolidayName = ''
      var nextPublicHolidayName = ''
      var nextPublicHolidayDate = ''

      var result = {
        day: today.getDay(),
        isPublicHoliday: null,
        isTomorrowPublicHoliday: null,
        publicHolidayName: null,
        nextPublicHolidayName: null,
        nextPublicHolidayDate: null,
        isSchoolHolidays: null,
        year: currentYear
      }
      
      promisePublicHoliday = new Promise(function(resolve, reject) {
      https
        .get(publicHolidayApi, res => {
          let body = ''
          res.on('data', chunk => {
            body += chunk
          })

          res.on('end', () => {
            try {
              var holidayJson = JSON.parse(body)
              // do something with JSON
              //var globalContext = this.context().global
              //globalContext.set('test', date)
              holidayJson = sortDates(holidayJson)
              const kdates = Object.keys(holidayJson)
              var previousDate = '1970-1-1'
              var nextDate = '1970-1-1'
              if ( kdates) {
                for (let i = 0; i < kdates.length; i++) {
                  currentDate = kdates[i]
                  if (i == kdates.length - 1) {
                    nextDate = '2100-12-1'
                  } else {
                    nextDate = kdates[i + 1]
                  }
                  if (currentDate == date) {
                    isPublicHoliday = true
                    publicHolidayName = holidayJson[currentDate]
                    nextPublicHolidayDate = new Date(nextDate).toLocaleDateString('fr')
                    nextPublicHolidayName = holidayJson[kdates[i + 1]]
                    break
                  } else if (currentDate < date && date < nextDate) {
                    isPublicHoliday = false
                    publicHolidayName = null
                    nextPublicHolidayDate = new Date(nextDate).toLocaleDateString('fr')
                    nextPublicHolidayName = holidayJson[kdates[i + 1]]
                    break
                  }
                }
                //calculate tomorrow
                var isTomorrowPublicHoliday = false
                for (let i = 0; i < kdates.length; i++) {
                  currentDate = kdates[i]
                  if (i == kdates.length - 1) {
                    nextDate = '2100-12-1'
                  } else {
                    nextDate = kdates[i + 1]
                  }
                  if (tomorrow == currentDate) {
                    isTomorrowPublicHoliday = true
                    break
                  } else if (currentDate < tomorrow && tomorrow < nextDate) {
                    isTomorrowPublicHoliday = false
                    break
                  }
                }
                var result = {
                  day: today.getDay(),
                  isPublicHoliday: isPublicHoliday,
                  isTomorrowPublicHoliday: isTomorrowPublicHoliday,
                  publicHolidayName: publicHolidayName,
                  nextPublicHolidayName: nextPublicHolidayName,
                  nextPublicHolidayDate: nextPublicHolidayDate,
                  year: currentYear
                }
                resolve(result)
              }else {
                displayErrorMsg(  "Public Holiday API returns no record")
              }
            
            } catch (error) {
                if (done) {
                    // Node-RED 1.0 compatible
                    done(error);
                } else {
                    // Node-RED 0.x compatible
                    node.error(error, msg);
                }
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
        })
    })
  })
promiseEntireSchoolHolidaysCalendar = new Promise(function(resolve, reject) {
  https
    .get(entireSchoolHolidaysCalendarApi, res => {
      let body = ''

      res.on('data', chunk => {
        body += chunk
      })

      res.on('end', () => {
        try {
          var holidayJson = JSON.parse(body)
          console.log("# promiseEntireSchoolHolidaysCalendar Response: "+body)
          var records = holidayJson.records
          var orderedRecords;
          var schoolHolidaysName = null
          var daysDifference = -1
          var nextHolidayName = null
          var isSchoolHolidays = false
          var isTomorrowSchoolHolidays = false
          var startDate = null
          var endDate = null
          var zones = null
          if (records) {
            for (let i = 0; i < records.length; i ++) {
              var timeDifference = Date.parse(records[i].fields.start_date) - today.getTime();
              var _daysDifference = timeDifference / (1000 * 3600 * 24);
              zones = records[i].fields.zones
              if ( _daysDifference <= 0 ) {
                    //case when the holidays are already passed or start today
                    isSchoolHolidays = true
                    schoolHolidaysName = records[i].fields.description
                    schoolHolidaysEndDate = new Date(records[i].fields.end_date).toLocaleDateString('fr')
                    var tomorrowDate = new Date(today);
                    tomorrowDate.setDate(today.getDate() + 1);
                    if ( tomorrowDate >= Date.parse(records[i].fields.start_date) && tomorrowDate <= Date.parse(records[i].fields.end_date)){
                      isTomorrowSchoolHolidays = true
                    }
                  }else {
                    if (daysDifference == -1 || _daysDifference<daysDifference) {
                      nextHolidayName = records[i].fields.description
                      daysDifference = Math.round(_daysDifference)
                      startDate = new Date(records[i].fields.start_date).toLocaleDateString('fr')
                      endDate = new Date(records[i].fields.end_date).toLocaleDateString('fr')
                    }
                  }
            }
            
            console.log("- daysDifference: "+daysDifference)
            console.log("- nextHolidayName  : "+nextHolidayName)
            var result = {
              isSchoolHolidays: isSchoolHolidays,
              schoolHolidaysName: schoolHolidaysName,
              schoolHolidaysEndDate: schoolHolidaysEndDate,
              isTomorrowSchoolHolidays: isTomorrowSchoolHolidays,
              nextHolidayName: nextHolidayName,
              daysDifference: daysDifference,
              startDate: startDate,
              endDate: endDate,
              zones: zones,
            }
            resolve(result)
          }else {
            displayErrorMsg("School Holiday API for the whole year is returning no records")     
          }
        } catch (error) {
            if (done) {
                // Node-RED 1.0 compatible
                done(error);
            } else {
                // Node-RED 0.x compatible
                node.error(error, msg);
            }
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
    })
})
})
  Promise.all([promisePublicHoliday,promiseEntireSchoolHolidaysCalendar]).then((values) => {
    result =  {
      day: today.getDay(),
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
      schoolPeriod: beginningYear+'-'+endYear,
      year: currentYear,
      region: this.geo,
      academy: this.academy,
      zones: values[1].zones,
      version: version
    }
    msg.payload = result
    node.send(msg)
  });
  
  
  })
}
  RED.nodes.registerType('french-holidays', retrieveFrenchHoliday)
}
