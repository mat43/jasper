"use client"

import { useState, useEffect } from "react";

export default function UpcomingEvents() {
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		async function fetchEvents() {
			try {
				const res = await fetch("/api/events");
				const data = await res.json();
				if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
				setEvents(data);
			} catch (err) {
				console.error(err);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		}
		fetchEvents();
	}, []);

	return (
		<div className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-2xl p-6 hover:shadow-2xl hover:shadow-indigo-500/20 dark:hover:shadow-indigo-400/30 transition-all duration-300 flex flex-col">
				<div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 dark:from-indigo-400/40 dark:to-purple-400/40 rounded-full blur-2xl"></div>

			{loading ? (
				<p className="mt-4 text-gray-500 dark:text-gray-400">Loading...</p>
			) : error ? (
				<p className="mt-4 text-red-500">Error: {error}</p>
			) : events.length === 0 ? (
				<div className="flex-1 flex items-center justify-center">
					<p className="text-gray-500 dark:text-gray-400 text-sm">No upcoming events</p>
				</div>
			) : (
				<ul className="relative space-y-2 overflow-auto flex-1 max-h-64">
					{events.map((e, i) => (
						<li key={i} className="flex justify-between items-start p-3 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-all">
							<span className="font-medium text-gray-900 dark:text-white flex-1 text-sm">{e.label}</span>
							<span className="text-xs text-gray-600 dark:text-gray-400 ml-4 whitespace-nowrap">
								{e.time}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
