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
		<div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100 flex flex-col transition-shadow duration-300 ease-in-out hover:shadow-xl">
			<h2 className="text-lg font-semibold text-gray-800">Upcoming Events</h2>

			{loading ? (
				<p className="mt-4 text-gray-500">Loading events...</p>
			) : error ? (
				<p className="mt-4 text-red-500">Error: {error}</p>
			) : (
				<ul className="mt-4 space-y-2 text-gray-700 overflow-auto max-h-30">
					{events.map((e, i) => (
						<li key={i} className="flex justify-between">
							<span className="">{e.label}</span>
							<span className="text-sm text-gray-500 ml-4 whitespace-nowrap">
								{e.time}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
