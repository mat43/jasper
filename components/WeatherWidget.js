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
			<div className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-2xl p-6 hover:shadow-xl hover:shadow-yellow-500/10 dark:hover:shadow-yellow-400/20 transition-all duration-300 flex items-center justify-center min-h-[200px]">
				{loading
					? <p className="text-gray-600 dark:text-gray-400">Loading...</p>
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
		{ label: 'Humidity', value: `${humidity}%`, Icon: WiHumidity },
		{ label: 'Wind', value: `${wind} mph`, Icon: WiStrongWind },
		{ label: 'Sunrise', value: toTime(sunrise), Icon: WiSunrise },
		{ label: 'Sunset', value: toTime(sunset), Icon: WiSunset },
	]

	return (
		<div className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-2xl p-6 hover:shadow-2xl hover:shadow-yellow-500/20 dark:hover:shadow-yellow-400/30 transition-all duration-300 flex flex-col">
				<div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 dark:from-yellow-400/40 dark:to-orange-400/40 rounded-full blur-2xl"></div>
			<div className="relative flex items-center justify-between mb-4">
				<div className="space-y-1">
					<h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Weather</h2>
					<p className="text-4xl font-bold text-gray-900 dark:text-white">{temp}°F</p>
					<p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{description}</p>
				</div>
				<Icon className={`w-20 h-20 ${color}`} />
			</div>

			{/* Stats grid */}
			<div className="relative grid grid-cols-2 gap-3 text-sm">
				{stats.map(({ label, value, Icon: StatIcon }) => (
					<div key={label} className="flex items-center space-x-2 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-2.5">
						<StatIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
						<div>
							<p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
							<p className="font-semibold text-gray-900 dark:text-white">{value}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}