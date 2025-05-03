"use client";

import { useState, useEffect } from "react";
import {
	WiDaySunny,
	WiCloud,
	WiRain,
	WiSnow,
	WiThunderstorm,
	WiFog,
	WiRainMix,
} from "react-icons/wi";

// Map OpenWeather 'main' descriptions to icons and colors
const iconMap = {
	Clear: { Icon: WiDaySunny, color: "text-yellow-400" },
	Clouds: { Icon: WiCloud, color: "text-gray-400" },
	Rain: { Icon: WiRain, color: "text-blue-500" },
	Drizzle: { Icon: WiRainMix, color: "text-blue-400" },
	Snow: { Icon: WiSnow, color: "text-blue-200" },
	Thunderstorm: { Icon: WiThunderstorm, color: "text-purple-500" },
	Mist: { Icon: WiFog, color: "text-gray-300" },
	Smoke: { Icon: WiFog, color: "text-gray-300" },
	Haze: { Icon: WiFog, color: "text-gray-300" },
	Fog: { Icon: WiFog, color: "text-gray-300" },
	Dust: { Icon: WiFog, color: "text-gray-300" },
	Sand: { Icon: WiFog, color: "text-gray-300" },
	Ash: { Icon: WiFog, color: "text-gray-300" },
	Squall: { Icon: WiThunderstorm, color: "text-purple-500" },
	Tornado: { Icon: WiThunderstorm, color: "text-purple-500" },
};

export default function WeatherWidget() {
	const [weather, setWeather] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		async function fetchData() {
			try {
				const res = await fetch("/api/weather");
				const data = await res.json();
				if (!res.ok) throw new Error(data.message || `API error: ${res.status}`);
				setWeather(data);
			} catch (err) {
				console.error(err);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		}
		fetchData();
	}, []);

	if (loading) {
		return (
			<div className="p-4 rounded-2xl shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
				<p className="text-gray-500">Loading...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 rounded-2xl shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
				<p className="text-red-500 text-sm">Error: {error}</p>
			</div>
		);
	}

	const { temp, description, humidity, wind, sunrise, sunset } = weather;
	const { Icon, color } = iconMap[description] || iconMap.Clear;
	const sunriseTime = new Date(sunrise * 1000).toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' });
	const sunsetTime = new Date(sunset * 1000).toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' });

	return (
		<div className="p-4 rounded-2xl shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 flex flex-col justify-between transition-shadow duration-300 ease-in-out hover:shadow-xl">
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-lg font-semibold text-gray-800">Weather</h2>
					<p className="text-3xl font-bold text-gray-900 mt-1">{temp}°F</p>
					<p className="text-base text-gray-700 capitalize mt-0.5">{description}</p>
				</div>
				<Icon className={`text-8xl ${color}`} />
			</div>
			<div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
				<span>Humidity: {humidity}%</span>
				<span>Wind: {wind} mph</span>
				<span>Sunrise: {sunriseTime}</span>
				<span>Sunset: {sunsetTime}</span>
			</div>
		</div>
	);
}