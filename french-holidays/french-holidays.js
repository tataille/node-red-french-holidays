module.exports = function (RED) {
  const https = require('https')
  const sortDates = obj =>
    Object.keys(obj)
      .sort()
      .reduce((res, key) => ((res[key] = obj[key]), res), {})

  var geo = {}
  geo['Alsace-Moselle'] = 'alsace-moselle'
  geo['Guadeloupe'] = 'guadeloupe'
  geo['La Réunion'] = 'la-reunion'
  geo['Martinique'] = 'martinique'
  geo['Mayotte'] = 'mayotte'
  geo['Métropole'] = 'metropole'
  geo['Nouvelle Calédonie'] = 'nouvelle-caledonie'
  geo['Polynésie Française'] = 'polyneise-francaise'
  geo['Saint Barthélémy'] = 'saint-barthelemy'
  geo['Saint Martin'] = 'saint-martin'
  geo['Saint Pierre et Miquelon'] = 'saint-pierre-et-miquelon'
  geo['Wallis et Futuna'] = 'wallis-et-futuna'

  function toISOLocal(d) {
    const z = n => ('0' + n).slice(-2);
    let off = d.getTimezoneOffset();
    const sign = off < 0 ? '+' : '-';
    off = Math.abs(off);
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, -1) + sign + z(off / 60 | 0) + ':' + z(off % 60);
  }

  function RetrieveFrenchHoliday (config) {
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
      var year = today.getFullYear()-1
      var nextYear = year+1
      var date = toISOLocal(new Date()).split('T')[0]
      var publicHolidayApi =
        'https://calendrier.api.gouv.fr/jours-feries/' + geo[this.geo] + '.json'
      var schoolHolidaysApi =
        'https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-calendrier-scolaire&q=&rows=100&facet=description&facet=start_date&facet=end_date&facet=zones&facet=annee_scolaire&refine.start_date='+year+'&refine.location='+this.academy
      var entireSchoolHolidaysCalendarApi = 
      'https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-calendrier-scolaire&q=&rows=100&facet=description&facet=start_date&facet=end_date&facet=location&facet=zones&refine.location='+this.academy+'&refine.annee_scolaire='+year+'-'+nextYear
      'https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-calendrier-scolaire&q=&facet=description&facet=population&facet=start_date&facet=end_date&facet=location&facet=annee_scolaire&refine.start_date=2022&refine.location=Martinique'
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
        year: year
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
                year: year
              }
              resolve(result)
              
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
  promiseSchoolHolidays = new Promise(function(resolve, reject) {
    https
      .get(schoolHolidaysApi, res => {
        let body = ''

        res.on('data', chunk => {
          body += chunk
        })

        res.on('end', () => {
          try {
            var holidayJson = JSON.parse(body)
            var records = holidayJson.records
            var isSchoolHolidays = false
            var isTomorrowSchoolHolidays = false
            var schoolHolidaysName = null

            for (let i = 0; i < records.length; i++) {
              if (records[i].fields.population != "Enseignants") {
                if ( Date.parse(records[i].fields.start_date) <= today  && today <= Date.parse(records[i].fields.end_date)){
                  isSchoolHolidays = true
                  schoolHolidaysName = records[i].description
                  break;
                }
              }
            }
            var tomorrowDate = new Date(today);
            tomorrowDate.setDate(today.getDate() + 1);
            for (let i = 0; i < records.length; i++) {
              if (records[i].fields.population != "Enseignants") {
                if ( tomorrowDate >= Date.parse(records[i].fields.start_date) && tomorrowDate <= Date.parse(records[i].fields.end_date)){
                  isTomorrowSchoolHolidays = true
                  break;
                }
              }
            }
            var result = {
              isSchoolHolidays: isSchoolHolidays,
              isTomorrowSchoolHolidays: isTomorrowSchoolHolidays,
              schoolHolidaysName: schoolHolidaysName,
            }
            resolve(result)
            
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
          console.log(body)
          var records = holidayJson.records
          var orderedRecords;
          var schoolHolidaysName = null
          var daysDifference = -1
          var nextHolidayName = null
          var startDate = null
          var endDate = null
          for (let i = 0; i < records.length; i++) {
            var timeDifference = Date.parse(records[i].fields.start_date) - today.getTime();
            var _daysDifference = timeDifference / (1000 * 3600 * 24);
            if ( _daysDifference <= 0 ) {
              //case when the holidays are already passed or start today

            }else {
                if (daysDifference == -1 || _daysDifference<daysDifference) {
                  nextHolidayName = records[i].fields.description
                  daysDifference = Math.round(_daysDifference)
                  startDate = new Date(records[i].fields.start_date).toLocaleDateString('fr')
                  endDate = new Date(records[i].fields.end_date).toLocaleDateString('fr')
                }
            }
          }
           
          console.log("daysDifference: "+daysDifference)
                console.log("holiday  : "+nextHolidayName)
          var result = {
            nextHolidayName: nextHolidayName,
            daysDifference: daysDifference,
            schoolHolidaysName: schoolHolidaysName,
            startDate: startDate,
            endDate: endDate,
          }
          resolve(result)
          
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
  Promise.all([promisePublicHoliday,promiseSchoolHolidays,promiseEntireSchoolHolidaysCalendar]).then((values) => {
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
      nextSchoolHolidaysCoutdownInDays: values[2].daysDifference,
      nextSchoolHolidaysName: values[2].nextHolidayName,
      nextSchoolHolidaysStartDate: values[2].startDate,
      nextSchoolHolidaysEndDate: values[2].endDate,
      year: year
    }
    msg.payload = result
    node.send(msg)
  });
  
  
  })
}
  RED.nodes.registerType('french-holidays', RetrieveFrenchHoliday)
}
