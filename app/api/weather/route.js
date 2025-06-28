import { NextResponse } from "next/server";

// In-memory cache
let cachedWeather = null;
let lastFetchTime = 0;
const CACHE_DURATION = 120000; // 2 minutes in milliseconds

export async function GET() {
	const now = Date.now();
	if (!cachedWeather || now - lastFetchTime > CACHE_DURATION) {
		const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
		if (!API_KEY) {
			return NextResponse.json({ message: "Missing OpenWeatherMap API key" }, { status: 500 });
		}

		const res = await fetch(
			`https://api.openweathermap.org/data/2.5/forecast?q=Columbus,US&units=imperial&appid=${API_KEY}`
		);
		const data = await res.json();
		if (!res.ok) {
			return NextResponse.json({ message: data.message || "API error" }, { status: res.status });
		}
		if (!data.list?.length || !data.city) {
			return NextResponse.json({ message: "Invalid forecast data" }, { status: 502 });
		}

		const first = data.list[0];
		const { sunrise, sunset } = data.city;

		cachedWeather = {
			temp: Math.round(first.main.temp),
			description: first.weather[0].main,
			humidity: first.main.humidity,
			wind: Math.round(first.wind.speed),
			iconCode: first.weather[0].icon,
			sunrise,
			sunset,
		};
		lastFetchTime = now;
	}
	return NextResponse.json(cachedWeather);
}