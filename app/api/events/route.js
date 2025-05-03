import { NextResponse } from "next/server";

export async function GET() {
	const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
	const API_KEY = process.env.GOOGLE_API_KEY;
	if (!CALENDAR_ID || !API_KEY) {
		return NextResponse.json(
			{ message: "Missing GOOGLE_CALENDAR_ID or GOOGLE_API_KEY" },
			{ status: 500 }
		);
	}

	const now = new Date().toISOString();
	const url = new URL(
		`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
			CALENDAR_ID
		)}/events`
	);
	url.search = new URLSearchParams({
		key: API_KEY,
		timeMin: now,
		maxResults: "10",
		singleEvents: "true",
		orderBy: "startTime",
	}).toString();

	const res = await fetch(url);
	const data = await res.json();
	if (!res.ok) {
		return NextResponse.json(
			{ message: data.error?.message || "API error" },
			{ status: res.status }
		);
	}

	const monthNames = [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun",
		"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
	];
	const events = (data.items || []).map(evt => {
		const label = evt.summary || "(No title)";
		let time;
		if (evt.start.dateTime) {
			// Timed event
			time = new Date(evt.start.dateTime).toLocaleString("en-US", {
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
			});
		} else if (evt.start.date) {
			// All-day event: parse Y-M-D to local date without timezone shift
			const [year, month, day] = evt.start.date.split('-');
			time = `${monthNames[parseInt(month, 10) - 1]} ${parseInt(day, 10)} (All day)`;
		} else {
			time = "";
		}
		return { label, time };
	});

	return NextResponse.json(events);
}