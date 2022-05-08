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
      var year = today.getFullYear()
      var date = toISOLocal(new Date()).split('T')[0]
      var publicHolidayApi =
        'https://calendrier.api.gouv.fr/jours-feries/' + geo[this.geo] + '.json'
      var schoolHolidayApi =
        'https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-calendrier-scolaire&q=&rows=100&facet=description&facet=start_date&facet=end_date&facet=zones&facet=annee_scolaire&refine.start_date='+year+'&refine.location='+this.academy
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
        isSchoolHoliday: null,
        year: year
      }
      //msg.payload = result
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
                  nextPublicHolidayDate = nextDate
                  nextPublicHolidayName = holidayJson[kdates[i + 1]]
                  break
                } else if (currentDate < date && date < nextDate) {
                  isPublicHoliday = false
                  publicHolidayName = null
                  nextPublicHolidayDate = nextDate
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
              var result1 = {
                day: today.getDay(),
                isPublicHoliday: isPublicHoliday,
                isTomorrowPublicHoliday: isTomorrowPublicHoliday,
                publicHolidayName: publicHolidayName,
                nextPublicHolidayName: nextPublicHolidayName,
                nextPublicHolidayDate: nextPublicHolidayDate,
                year: year
              }
              resolve(result1)
              
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
  promiseSchoolHoliday = new Promise(function(resolve, reject) {
    https
      .get(schoolHolidayApi, res => {
        let body = ''

        res.on('data', chunk => {
          body += chunk
        })

        res.on('end', () => {
          try {
            var holidayJson = JSON.parse(body)
            var records = holidayJson.records
            var isSchoolHoliday = false
            var isTomorrowSchoolHoliday = false
            var schoolHolidayName = null

            for (let i = 0; i < records.length; i++) {
              if (records[i].fields.population == "-") {
                if ( Date.parse(records[i].fields.start_date) <= today  && today <= Date.parse(records[i].fields.end_date)){
                  isSchoolHoliday = true
                  schoolHolidayName = records[i].description
                  break;
                }
              }
            }
            for (let i = 0; i < records.length; i++) {
              if (records[i].fields.population == "-") {
                if ( tomorrow >= Date.parse(records[i].fields.start_date) && tomorrow <= Date.parse(records[i].fields.end_date)){
                  isTomorrowSchoolHoliday = true
                  break;
                }
              }
            }
            var result2 = {
              isSchoolHoliday: isSchoolHoliday,
              isTomorrowSchoolHoliday: isTomorrowSchoolHoliday,
              schoolHolidayName: schoolHolidayName,
            }
            resolve(result2)
            
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
  Promise.all([promisePublicHoliday,promiseSchoolHoliday]).then((values) => {
    result =  {
      day: today.getDay(),
      isPublicHoliday: values[0].isPublicHoliday,
      isTomorrowPublicHoliday: values[0].isTomorrowPublicHoliday,
      publicHolidayName: values[0].publicHolidayName,
      nextPublicHolidayName: values[0].nextPublicHolidayName,
      nextPublicHolidayDate: values[0].nextPublicHolidayDate,
      isSchoolHoliday: values[1].isSchoolHoliday,
      isTomorrowSchoolHoliday: values[1].isTomorrowSchoolHoliday,
      schoolHolidayName: values[1].schoolHolidayName,
      year: year
    }
    msg.payload = result
    node.send(msg)
  });
  
  
  })
}
  RED.nodes.registerType('french-holidays', RetrieveFrenchHoliday)
}
