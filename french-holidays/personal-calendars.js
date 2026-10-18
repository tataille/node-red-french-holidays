'use strict'
const fs = require('fs').promises
const https = require('https')
const ICAL = require('ical.js')

const CACHE_MS = 12 * 60 * 60 * 1000
const MAX_BYTES = 2 * 1024 * 1024
const MAX_OCCURRENCES = 3000
const cache = new Map()

function readHttps(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 3) return reject(new Error('Too many ICS redirects'))
    let parsed
    try { parsed = new URL(url) } catch (e) { return reject(e) }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
      return reject(new Error('Calendar URL must use HTTPS without embedded credentials'))
    }
    // Explicit allowlist for remote protocols. Never use file:// or HTTP for URLs.
    const request = https.get(parsed, { timeout: 10000 }, response => {
      if ([301, 302, 307, 308].includes(response.statusCode)) {
        const redirect = new URL(response.headers.location || '', parsed)
        response.resume()
        return resolve(readHttps(redirect.toString(), redirects + 1))
      }
      if (response.statusCode !== 200) {
        response.resume()
        return reject(new Error('ICS server returned HTTP ' + response.statusCode))
      }
      const chunks = []
      let size = 0
      response.on('data', chunk => {
        size += chunk.length
        if (size > MAX_BYTES) {
          request.destroy(new Error('ICS file exceeds 2 MB limit'))
          return
        }
        chunks.push(chunk)
      })
      response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      response.on('error', reject)
    })
    request.on('timeout', () => request.destroy(new Error('ICS request timed out')))
    request.on('error', reject)
  })
}

function localDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
function ymd(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
}
function format(date) {
  if (!date) return null
  return String(date.getDate()).padStart(2, '0') + '/' + String(date.getMonth() + 1).padStart(2, '0') + '/' + date.getFullYear()
}
function dayDiff(from, to) {
  return Math.round((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
    Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / 86400000)
}
function isoDay(date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}
function eventInterval(start, end, allDay) {
  // For all-day ICS events DTEND is exclusive, as required by RFC 5545.
  // For timed events, any touched calendar day is treated as a personal holiday.
  const first = localDay(start)
  const lastInstant = new Date(end.getTime() - 1)
  const last = localDay(lastInstant)
  if (!Number.isFinite(first.getTime()) || !Number.isFinite(last.getTime()) || last < first) return null
  return { start: first, end: last }
}
function collectEvents(ics, today) {
  const root = new ICAL.Component(ICAL.parse(ics))
  const begin = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  const horizon = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate())
  const output = []
  const components = root.getAllSubcomponents('vevent')
  const overrides = new Map()
  for (const component of components) {
    const event = new ICAL.Event(component)
    if (event.isRecurrenceException()) {
      const id = event.uid
      if (!overrides.has(id)) overrides.set(id, [])
      overrides.get(id).push(component)
    }
  }
  for (const component of components) {
    const event = new ICAL.Event(component)
    if (event.isRecurrenceException() || component.getFirstPropertyValue('status') === 'CANCELLED') continue
    for (const exception of overrides.get(event.uid) || []) event.relateException(new ICAL.Event(exception))
    const add = occurrence => {
      const details = event.getOccurrenceDetails(occurrence)
      if (details.item.component.getFirstPropertyValue('status') === 'CANCELLED') return
      const start = details.startDate.toJSDate()
      const end = details.endDate.toJSDate()
      if (end <= begin || start >= horizon) return
      const interval = eventInterval(start, end, details.startDate.isDate)
      if (interval) output.push({ ...interval, name: String(details.item.summary || 'Personal holiday') })
    }
    if (!event.isRecurring()) {
      add(event.startDate)
    } else {
      const iterator = event.iterator()
      let next
      let count = 0
      while ((next = iterator.next()) && count++ < MAX_OCCURRENCES) {
        if (next.toJSDate() > horizon) break
        add(next)
      }
    }
  }
  return output
}
function blank() {
  return {
    isPersonalHolidays: false,
    isTomorrowPersonalHolidays: false,
    personalHolidaysName: null,
    personalHolidaysEndDate: null,
    nextPersonalHolidaysName: null,
    nextPersonalHolidaysStartDate: null,
    nextPersonalHolidaysEndDate: null,
    nextPersonalHolidaysCountdownInDays: null,
    personalCalendars: []
  }
}
function compute(events, today) {
  const result = blank()
  const todayDay = localDay(today)
  const tomorrow = new Date(todayDay.getFullYear(), todayDay.getMonth(), todayDay.getDate() + 1)
  const ordered = events.slice().sort((a, b) => a.start - b.start || a.end - b.end)
  const current = ordered.filter(e => e.start <= todayDay && e.end >= todayDay)
  const next = ordered.find(e => e.start > todayDay)
  result.isPersonalHolidays = current.length > 0
  result.isTomorrowPersonalHolidays = ordered.some(e => e.start <= tomorrow && e.end >= tomorrow)
  if (current.length) {
    result.personalHolidaysName = current.map(e => e.name).join(', ')
    result.personalHolidaysEndDate = format(new Date(Math.max(...current.map(e => e.end.getTime()))))
  }
  if (next) {
    result.nextPersonalHolidaysName = next.name
    result.nextPersonalHolidaysStartDate = format(next.start)
    result.nextPersonalHolidaysEndDate = format(next.end)
    result.nextPersonalHolidaysCountdownInDays = dayDiff(todayDay, next.start)
  }
  return result
}
async function loadOne(source) {
  const type = source.type || 'url'
  const target = String(source.source || '').trim()
  if (!target) throw new Error('Missing ICS calendar source')
  const key = type + ':' + target
  const previous = cache.get(key)
  if (previous && Date.now() - previous.time < CACHE_MS) return previous.text
  try {
    const content = type === 'file' ? await fs.readFile(target, 'utf8') :
      type === 'url' ? await readHttps(target) : (() => { throw new Error('Unknown ICS source type') })()
    if (Buffer.byteLength(content) > MAX_BYTES) throw new Error('ICS file exceeds 2 MB limit')
    // Validate before inserting in cache.
    new ICAL.Component(ICAL.parse(content))
    cache.set(key, { text: content, time: Date.now() })
    return content
  } catch (e) {
    if (previous) return previous.text
    throw e
  }
}
async function loadCalendars(configured, today, warn) {
  const calendars = Array.isArray(configured) ? configured : JSON.parse(configured || '[]')
  if (!Array.isArray(calendars)) throw new Error('Personal calendars must be an array')
  const entries = []
  const details = []
  for (const calendar of calendars) {
    if (!calendar || !calendar.source || calendar.enabled === false) continue
    const name = String(calendar.name || 'Personal').trim()
    try {
      const events = collectEvents(await loadOne(calendar), today)
        .filter(e => !calendar.filter || e.name.toLowerCase().includes(String(calendar.filter).toLowerCase()))
        .map(e => ({ ...e, name: e.name, calendar: name }))
      const state = compute(events, today)
      details.push({ name, ...state, personalCalendars: undefined })
      entries.push(...events)
    } catch (error) {
      warn('Calendar "' + name + '": ' + error.message)
      details.push({ name, error: 'calendar unavailable' })
    }
  }
  return { ...compute(entries, today), personalCalendars: details }
}
module.exports = { loadCalendars, collectEvents, compute, blank }
