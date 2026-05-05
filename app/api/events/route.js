// Private API route — fetches events from a Google Calendar.
// Requires an authenticated session; the Google API key is never exposed to clients.

import { NextResponse } from 'next/server'
import { requireAuth, logError } from '@/lib/auth'

export async function GET() {
  const { unauth } = await requireAuth()
  if (unauth) return unauth

  const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID
  const API_KEY     = process.env.GOOGLE_API_KEY
  if (!CALENDAR_ID || !API_KEY) {
    // Don't reveal which variable is missing
    return NextResponse.json({ message: 'Calendar not configured' }, { status: 503 })
  }

  try {
    const now = new Date().toISOString()
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`
    )
    url.search = new URLSearchParams({
      key:          API_KEY,
      timeMin:      now,
      maxResults:   '10',
      singleEvents: 'true',
      orderBy:      'startTime',
    }).toString()

    const res  = await fetch(url)
    const data = await res.json()
    if (!res.ok) {
      // Return a generic message; don't echo the Google error (may contain key or quota info)
      return NextResponse.json({ message: 'Calendar fetch failed' }, { status: 502 })
    }

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const events = (data.items || []).map(evt => {
      const label = evt.summary || '(No title)'
      let time = ''
      if (evt.start?.dateTime) {
        time = new Date(evt.start.dateTime).toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        })
      } else if (evt.start?.date) {
        const [, month, day] = evt.start.date.split('-')
        time = `${monthNames[parseInt(month, 10) - 1]} ${parseInt(day, 10)} (All day)`
      }
      return { label, time }
    })

    return NextResponse.json(events)
  } catch (err) {
    logError('GET /api/events', err)
    return NextResponse.json({ message: 'Calendar fetch failed' }, { status: 502 })
  }
}
