const assert = require('assert')
const { execFileSync } = require('child_process')
const path = require('path')
const { collectEvents, compute } = require('../french-holidays/personal-calendars')

const PARIS_ZONE = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/Paris',
  'BEGIN:DAYLIGHT', 'DTSTART:19700329T020000', 'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'DTSTART:19701025T030000', 'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE'
]
function calendar(events, zones = []) {
  return ['BEGIN:VCALENDAR','VERSION:2.0', ...zones, ...events.flatMap((properties, i) =>
    ['BEGIN:VEVENT', 'UID:case-' + i, ...properties, 'SUMMARY:Leave', 'END:VEVENT']), 'END:VCALENDAR'].join('\r\n')
}
function days(ics, hostZone = 'Europe/Paris', reference = '2026-01-01T12:00:00Z') {
  const modulePath = path.resolve(__dirname, '../french-holidays/personal-calendars')
  const script = [
    'const {collectEvents}=require(' + JSON.stringify(modulePath) + ');',
    'const items=collectEvents(' + JSON.stringify(ics) + ',new Date(' + JSON.stringify(reference) + '));',
    'process.stdout.write(JSON.stringify(items.map(x=>[x.start.getFullYear(),x.start.getMonth()+1,x.start.getDate(),x.end.getFullYear(),x.end.getMonth()+1,x.end.getDate()])));'
  ].join('\n')
  return JSON.parse(execFileSync(process.execPath, ['-e',script], {
    env: {...process.env, TZ: hostZone}, encoding:'utf8'
  }))
}
describe('ICS comprehensive time zone and recurrence regression', function () {
  it('keeps all-day DTSTART/DTEND dates across UTC, Paris and Martinique host TZ', function () {
    const ics = calendar([['DTSTART;VALUE=DATE:20260328','DTEND;VALUE=DATE:20260331']])
    for (const zone of ['UTC', 'Europe/Paris','America/Martinique','Indian/Reunion']) {
      assert.deepStrictEqual(days(ics,zone), [[2026,3,28,2026,3,30]])
    }
  })
  it('uses Paris wall dates for explicit TZID, even on a UTC host', function () {
    const ics = calendar([['DTSTART;TZID=Europe/Paris:20260329T003000',
      'DTEND;TZID=Europe/Paris:20260329T013000']], PARIS_ZONE)
    for (const zone of ['UTC','Europe/Paris','America/Martinique']) {
      assert.deepStrictEqual(days(ics,zone), [[2026,3,29,2026,3,29]])
    }
  })
  it('uses the Paris civil date after the autumn clock change under UTC host', function () {
    const ics=calendar([['DTSTART;TZID=Europe/Paris:20261025T003000',
      'DTEND;TZID=Europe/Paris:20261025T013000']],PARIS_ZONE)
    assert.deepStrictEqual(days(ics,'UTC'), [[2026,10,25,2026,10,25]])
  })
  it('uses Paris civil days for a TZID event spanning midnight', function () {
    const ics=calendar([['DTSTART;TZID=Europe/Paris:20261024T233000',
      'DTEND;TZID=Europe/Paris:20261025T003000']],PARIS_ZONE)
    assert.deepStrictEqual(days(ics,'UTC'), [[2026,10,24,2026,10,25]])
  })
  it('does not include an exclusive midnight end day', function () {
    const ics=calendar([['DTSTART;TZID=Europe/Paris:20260328T200000',
      'DTEND;TZID=Europe/Paris:20260329T000000']],PARIS_ZONE)
    assert.deepStrictEqual(days(ics,'UTC'), [[2026,3,28,2026,3,28]])
  })
  it('keeps an absolute UTC event on the host civil calendar day', function () {
    const ics=calendar([['DTSTART:20260329T003000Z','DTEND:20260329T013000Z']])
    assert.deepStrictEqual(days(ics,'UTC'), [[2026,3,29,2026,3,29]])
    assert.deepStrictEqual(days(ics,'America/Martinique'), [[2026,3,28,2026,3,28]])
  })
  it('keeps all-day daily RRULE dates around autumn DST on UTC host', function () {
    const ics=calendar([['DTSTART;VALUE=DATE:20261024','DTEND;VALUE=DATE:20261025',
      'RRULE:FREQ=DAILY;COUNT=4']])
    assert.deepStrictEqual(days(ics,'UTC'), [
      [2026,10,24,2026,10,24],[2026,10,25,2026,10,25],
      [2026,10,26,2026,10,26],[2026,10,27,2026,10,27]])
  })
  it('handles a weekly RRULE with EXDATE', function () {
    const ics=calendar([['DTSTART;VALUE=DATE:20261005','DTEND;VALUE=DATE:20261006',
      'RRULE:FREQ=WEEKLY;COUNT=4','EXDATE;VALUE=DATE:20261019']])
    const dates=days(ics,'UTC')
    assert.deepStrictEqual(dates.map(d=>d[2]),[5,12,26])
  })
  it('handles a monthly RRULE including leap day correctly', function () {
    const ics=calendar([['DTSTART;VALUE=DATE:20240229','DTEND;VALUE=DATE:20240301',
      'RRULE:FREQ=YEARLY;COUNT=3']])
    const events=collectEvents(ics,new Date(2024,0,1))
    assert.deepStrictEqual(events.map(e=>e.start.getFullYear()),[2024])
  })
  it('handles an all-day occurrence moved by RECURRENCE-ID', function () {
    const ics=['BEGIN:VCALENDAR','VERSION:2.0',
      'BEGIN:VEVENT','UID:moved','DTSTART;VALUE=DATE:20261024',
      'DTEND;VALUE=DATE:20261025','RRULE:FREQ=DAILY;COUNT=2',
      'SUMMARY:Original','END:VEVENT',
      'BEGIN:VEVENT','UID:moved','RECURRENCE-ID;VALUE=DATE:20261025',
      'DTSTART;VALUE=DATE:20261027','DTEND;VALUE=DATE:20261028',
      'SUMMARY:Moved','END:VEVENT','END:VCALENDAR'].join('\r\n')
    assert.deepStrictEqual(days(ics,'UTC').map(d=>d[2]),[24,27])
  })
  it('excludes an explicitly cancelled event', function () {
    const ics=calendar([['DTSTART;VALUE=DATE:20261024',
      'DTEND;VALUE=DATE:20261025','STATUS:CANCELLED']])
    assert.deepStrictEqual(days(ics,'UTC'),[])
  })
  it('ignores zero-duration timed events', function () {
    const ics=calendar([['DTSTART:20261024T100000Z','DTEND:20261024T100000Z']])
    assert.deepStrictEqual(days(ics,'UTC'),[])
  })
  it('counts calendar days rather than 24-hour intervals at DST', function () {
    const state=compute([{name:'Holiday',start:new Date(2026,2,30),end:new Date(2026,2,30)}],
      new Date(2026,2,28,12))
    assert.strictEqual(state.nextPersonalHolidaysCountdownInDays,2)
  })
  it('preserves multiple overlapping calendars/events', function () {
    const events=[{name:'Parents',start:new Date(2026,9,24),end:new Date(2026,9,28)},
      {name:'Children',start:new Date(2026,9,26),end:new Date(2026,9,30)}]
    const state=compute(events,new Date(2026,9,27))
    assert.strictEqual(state.isPersonalHolidays,true)
    assert.strictEqual(state.personalHolidaysEndDate,'30/10/2026')
    assert.strictEqual(state.personalHolidaysName,'Parents, Children')
  })
})
