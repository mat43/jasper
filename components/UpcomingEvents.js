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
		<div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200 flex flex-col">
			<p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Upcoming Events</p>

			{loading ? (
				<p className="text-gray-400 text-sm">Loading...</p>
			) : error ? (
				<p className="text-red-500 text-sm">Error: {error}</p>
			) : events.length === 0 ? (
				<div className="flex-1 flex items-center justify-center">
					<p className="text-gray-400 text-sm">No upcoming events</p>
				</div>
			) : (
				<ul className="space-y-1.5 overflow-auto flex-1 max-h-64">
					{events.map((e, i) => (
						<li key={i} className="flex justify-between items-start p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-150">
							<span className="font-medium text-gray-800 flex-1 text-sm">{e.label}</span>
							<span className="text-xs text-gray-400 ml-4 whitespace-nowrap">{e.time}</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
