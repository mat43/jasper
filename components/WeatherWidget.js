'use client'

import React, { useState, useEffect } from 'react'
import {
	WiDaySunny,
	WiCloud,
	WiRain,
	WiSnow,
	WiThunderstorm,
	WiFog,
	WiRainMix,
	WiHumidity,
	WiStrongWind,
	WiSunrise,
	WiSunset,
} from 'react-icons/wi'

const iconMap = {
	Clear: { Icon: WiDaySunny, color: 'text-yellow-400' },
	Clouds: { Icon: WiCloud, color: 'text-gray-400' },
	Rain: { Icon: WiRain, color: 'text-blue-500' },
	Drizzle: { Icon: WiRainMix, color: 'text-blue-400' },
	Snow: { Icon: WiSnow, color: 'text-blue-200' },
	Thunderstorm: { Icon: WiThunderstorm, color: 'text-purple-500' },
	Mist: { Icon: WiFog, color: 'text-gray-300' },
	Smoke: { Icon: WiFog, color: 'text-gray-300' },
	Haze: { Icon: WiFog, color: 'text-gray-300' },
	Fog: { Icon: WiFog, color: 'text-gray-300' },
	Dust: { Icon: WiFog, color: 'text-gray-300' },
	Sand: { Icon: WiFog, color: 'text-gray-300' },
	Ash: { Icon: WiFog, color: 'text-gray-300' },
	Squall: { Icon: WiThunderstorm, color: 'text-purple-500' },
	Tornado: { Icon: WiThunderstorm, color: 'text-purple-500' },
}

export default function WeatherWidget() {
	const [weather, setWeather] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		async function fetchData() {
			try {
				const res = await fetch('/api/weather')
				const data = await res.json()
				if (!res.ok) throw new Error(data.message || `API error: ${res.status}`)
				setWeather(data)
			} catch (err) {
				console.error(err)
				setError(err.message)
			} finally {
				setLoading(false)
			}
		}
		fetchData()
	}, [])

	if (loading || error) {
		return (
			<div className="p-4 rounded-2xl shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
				{loading
					? <p className="text-gray-500">Loading...</p>
					: <p className="text-red-500 text-sm">Error: {error}</p>
				}
			</div>
		)
	}

	const { temp, description, humidity, wind, sunrise, sunset } = weather
	const { Icon, color } = iconMap[description] || iconMap.Clear
	const toTime = ts =>
		new Date(ts * 1000).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
		})

	const stats = [
		{ label: 'Humidity', value: `${humidity}%`, Icon: WiHumidity, border: 'border-l-yellow-400' },
		{ label: 'Wind', value: `${wind} mph`, Icon: WiStrongWind, border: 'border-l-purple-500' },
		{ label: 'Sunrise', value: toTime(sunrise), Icon: WiSunrise, border: 'border-l-orange-400' },
		{ label: 'Sunset', value: toTime(sunset), Icon: WiSunset, border: 'border-l-blue-500' },
	]

	return (
		<div className="p-4 rounded-2xl shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 flex flex-col transition-shadow duration-300 ease-in-out hover:shadow-xl">

			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<div className="space-y-1">
					<h2 className="text-lg font-semibold text-gray-800">Weather</h2>
					<p className="text-2xl font-bold text-gray-900">{temp}°F</p>
					<p className="text-sm text-gray-600 capitalize">{description}</p>
				</div>
				<Icon className={`w-12 h-12 ${color}`} />
			</div>

			{/* Stats grid with colored left borders */}
			<div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-700">
				{stats.map(({ label, value, Icon: StatIcon, border }) => (
					<div key={label} className={`flex items-center space-x-2 pl-2 ${border}`}>
						<StatIcon className="w-5 h-5 text-gray-600" />
						<div>
							<p className="leading-tight">{label}</p>
							<p className="font-semibold leading-tight">{value}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}