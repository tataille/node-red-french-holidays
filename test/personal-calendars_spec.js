const assert = require('assert')
const { collectEvents, compute, blank } = require('../french-holidays/personal-calendars')

describe('personal ICS calendars', function () {
  const today = new Date(2026, 9, 18, 12)
  it('defaults to disabled without affecting prior output', function () {
    assert.strictEqual(blank().isPersonalHolidays, false)
    assert.deepStrictEqual(blank().personalCalendars, [])
  })
  it('parses all-day events with an exclusive DTEND', function () {
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'BEGIN:VEVENT', 'UID:family-1', 'DTSTART;VALUE=DATE:20261018',
      'DTEND;VALUE=DATE:20261021', 'SUMMARY:Family holiday',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n')
    const events = collectEvents(ics, today)
    const state = compute(events, today)
    assert.strictEqual(state.isPersonalHolidays, true)
    assert.strictEqual(state.isTomorrowPersonalHolidays, true)
    assert.strictEqual(state.personalHolidaysEndDate, '20/10/2026')
    assert.strictEqual(compute(events, new Date(2026, 9, 21)).isPersonalHolidays, false)
  })
  it('identifies the next personal holiday and countdown', function () {
    const events = [
      { name: 'Parents', start: new Date(2026, 9, 24), end: new Date(2026, 9, 31) }
    ]
    const state = compute(events, today)
    assert.strictEqual(state.isPersonalHolidays, false)
    assert.strictEqual(state.nextPersonalHolidaysName, 'Parents')
    assert.strictEqual(state.nextPersonalHolidaysCountdownInDays, 6)
    assert.strictEqual(state.nextPersonalHolidaysStartDate, '24/10/2026')
  })
  it('accepts recurring events', function () {
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'BEGIN:VEVENT', 'UID:repeat', 'DTSTART;VALUE=DATE:20261018',
      'DTEND;VALUE=DATE:20261019', 'RRULE:FREQ=DAILY;COUNT=3',
      'SUMMARY:Days off', 'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n')
    const events = collectEvents(ics, today)
    assert.strictEqual(events.length, 3)
  })
  it('skips recurrence exclusions (EXDATE)', function () {
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'BEGIN:VEVENT', 'UID:except', 'DTSTART;VALUE=DATE:20261018',
      'DTEND;VALUE=DATE:20261019', 'RRULE:FREQ=DAILY;COUNT=4',
      'EXDATE;VALUE=DATE:20261019', 'SUMMARY:Days off',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n')
    const events = collectEvents(ics, today)
    assert.strictEqual(events.length, 3)
    assert.strictEqual(compute(events, new Date(2026, 9, 19)).isPersonalHolidays, false)
  })
  it('applies RECURRENCE-ID moved occurrences', function () {
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'BEGIN:VEVENT', 'UID:moved', 'DTSTART;VALUE=DATE:20261018',
      'DTEND;VALUE=DATE:20261019', 'RRULE:FREQ=DAILY;COUNT=2',
      'SUMMARY:Original', 'END:VEVENT',
      'BEGIN:VEVENT', 'UID:moved', 'RECURRENCE-ID;VALUE=DATE:20261019',
      'DTSTART;VALUE=DATE:20261022', 'DTEND;VALUE=DATE:20261023',
      'SUMMARY:Moved', 'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n')
    const events = collectEvents(ics, today)
    assert.strictEqual(events.length, 2)
    assert.strictEqual(compute(events, new Date(2026, 9, 19)).isPersonalHolidays, false)
    assert.strictEqual(compute(events, new Date(2026, 9, 22)).personalHolidaysName, 'Moved')
  })

  describe('time zones and daylight saving (Europe/Paris)', function () {
    const { execFileSync } = require('child_process')
    const path = require('path')
    function check(tz, icsLines, expected) {
      const script = [
        'const { collectEvents } = require(' + JSON.stringify(path.resolve(__dirname, '../french-holidays/personal-calendars')) + ');',
        'const events = collectEvents(' + JSON.stringify(icsLines.join('\r\n')) + ', new Date(2026, 0, 1));',
        'process.stdout.write(JSON.stringify(events.map(e => ({start:e.start.getFullYear()+"-"+(e.start.getMonth()+1)+"-"+e.start.getDate(),end:e.end.getFullYear()+"-"+(e.end.getMonth()+1)+"-"+e.end.getDate()}))));'
      ].join('\n')
      const actual = JSON.parse(execFileSync(process.execPath, ['-e', script], {
        env: { ...process.env, TZ: tz }, encoding: 'utf8'
      }))
      assert.deepStrictEqual(actual, expected)
    }
    function event(start, end) {
      return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
        'UID:dst-test', start, end, 'SUMMARY:Timezone test',
        'END:VEVENT', 'END:VCALENDAR']
    }
    it('keeps an all-day event on the same dates in UTC and Paris', function () {
      const lines = event('DTSTART;VALUE=DATE:20260329', 'DTEND;VALUE=DATE:20260331')
      const expected = [{start:'2026-3-29', end:'2026-3-30'}]
      check('Europe/Paris', lines, expected)
      check('UTC', lines, expected)
    })
    it('handles Europe/Paris spring clock change with UTC timestamps', function () {
      const lines = event('DTSTART:20260328T233000Z', 'DTEND:20260329T013000Z')
      check('Europe/Paris', lines, [{start:'2026-3-29',end:'2026-3-29'}])
    })
    it('handles Europe/Paris autumn repeated hour with UTC timestamps', function () {
      const lines = event('DTSTART:20261025T003000Z', 'DTEND:20261025T023000Z')
      check('Europe/Paris', lines, [{start:'2026-10-25',end:'2026-10-25'}])
    })
    it('handles timed events spanning midnight at spring transition', function () {
      const lines = event('DTSTART:20260328T223000Z', 'DTEND:20260329T003000Z')
      check('Europe/Paris', lines, [{start:'2026-3-28',end:'2026-3-29'}])
    })
    it('keeps recurring all-day dates stable across the spring transition', function () {
      const lines = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',
        'UID:dst-recurring','DTSTART;VALUE=DATE:20260328','DTEND;VALUE=DATE:20260329',
        'RRULE:FREQ=DAILY;COUNT=3','SUMMARY:Leave',
        'END:VEVENT','END:VCALENDAR']
      const expected = [{start:'2026-3-28',end:'2026-3-28'},
        {start:'2026-3-29',end:'2026-3-29'},
        {start:'2026-3-30',end:'2026-3-30'}]
      check('Europe/Paris', lines, expected)
      check('UTC', lines, expected)
    })
    it('resolves explicit TZID with a VTIMEZONE across spring DST', function () {
      const lines = ['BEGIN:VCALENDAR','VERSION:2.0',
        'BEGIN:VTIMEZONE','TZID:Europe/Paris',
        'BEGIN:DAYLIGHT','DTSTART:19700329T020000','TZOFFSETFROM:+0100',
        'TZOFFSETTO:+0200','RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU','END:DAYLIGHT',
        'BEGIN:STANDARD','DTSTART:19701025T030000','TZOFFSETFROM:+0200',
        'TZOFFSETTO:+0100','RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU','END:STANDARD',
        'END:VTIMEZONE','BEGIN:VEVENT','UID:tzid-dst',
        'DTSTART;TZID=Europe/Paris:20260329T013000',
        'DTEND;TZID=Europe/Paris:20260329T033000','SUMMARY:Clock change',
        'END:VEVENT','END:VCALENDAR']
      check('Europe/Paris', lines, [{start:'2026-3-29',end:'2026-3-29'}])
    })
  })

})
