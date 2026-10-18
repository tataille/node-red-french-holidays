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
})
