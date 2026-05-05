import { NextResponse } from 'next/server'
import { requireAuth, logError } from '@/lib/auth'

// In-memory cache — avoids hammering the external API on every request
let cachedWeather = null
let lastFetchTime = 0
const CACHE_DURATION = 120_000 // 2 minutes

export async function GET() {
  const { unauth } = await requireAuth()
  if (unauth) return unauth

  const now = Date.now()
  if (cachedWeather && now - lastFetchTime <= CACHE_DURATION) {
    return NextResponse.json(cachedWeather)
  }

  const API_KEY = process.env.OPENWEATHERMAP_API_KEY
  if (!API_KEY) {
    return NextResponse.json({ message: 'Weather not configured' }, { status: 503 })
  }

  try {
    const res  = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=Columbus,US&units=imperial&appid=${API_KEY}`
    )
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ message: 'Weather fetch failed' }, { status: 502 })
    }
    if (!data.list?.length || !data.city) {
      return NextResponse.json({ message: 'Invalid forecast data' }, { status: 502 })
    }

    const first             = data.list[0]
    const { sunrise, sunset } = data.city

    cachedWeather = {
      temp:        Math.round(first.main.temp),
      description: first.weather[0].main,
      humidity:    first.main.humidity,
      wind:        Math.round(first.wind.speed),
      iconCode:    first.weather[0].icon,
      sunrise,
      sunset,
    }
    lastFetchTime = now

    return NextResponse.json(cachedWeather)
  } catch (err) {
    logError('GET /api/weather', err)
    return NextResponse.json({ message: 'Weather fetch failed' }, { status: 502 })
  }
}
