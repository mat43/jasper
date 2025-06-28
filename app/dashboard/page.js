'use client'

// Imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProfileCard from '@/components/ProfileCard'
import SpendingBarChart from '@/components/SpendingBarChart'
import AccountSettingsModal from '@/components/AccountSettingsModal';
import { useSession, signOut } from 'next-auth/react';
import WeatherWidget from '@/components/WeatherWidget';
import UpcomingEvents from '@/components/UpcomingEvents';
import WeeklyChores from '@/components/WeeklyChores';
import SpendingCard from '@/components/SpendingCard'

// We just store name in database, so split it up
function splitName(fullName) {
	const [firstName, ...rest] = fullName.trim().split(' ')
	return { firstName, lastName: rest.join(' ') }
}

export default function HomePage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	const [notifications] = useState([
		'Alyssa unlocked the front door at 11:52pm',
		'Water leak detected',
		'Who ate the last slice of pizza',
		'New login from unknown device',
	])

	const [showSettings, setShowSettings] = useState(false);
	
	// Redirect if not signed in
	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/login');
		}
	}, [status, router]);

	if (status === 'unauthenticated') return null;

	// Show a loader while NextAuth is initializing
	if (status === 'loading') {
		return <p className="text-center py-8">Loading...</p>;
	}

	// At this point we know we have a session
	const { id, username, name, avatarUrl, email, venmoUsername } = session.user;
	const { firstName, lastName } = splitName(session.user.name)

	const me = {
		name: name,
		avatarUrl: avatarUrl,
		settingsOptions: [
			{ label: 'Account settings', onClick: () => setShowSettings(true) },
			{ label: 'Log out', onClick: () => signOut({ callbackUrl: '/login' }) },
		],
	}

	return (
		<div className="max-w-7xl mx-auto px-6 py-8">
			{/* Main: 4 cols × 3 rows */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-3 gap-6 auto-rows-fr">

				{/* Profile (1x1) */}
				<div>
					<ProfileCard
						name={me.name}
						subtitle={me.subtitle}
						avatarUrl={me.avatarUrl}
						settingsOptions={me.settingsOptions}
					/>
				</div>

				{/* Weather (1x1) */}
				<WeatherWidget />

				{/* House Temp (1x1) */}
				<div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-red-50 to-red-100 flex flex-col justify-between transition-shadow duration-300 ease-in-out hover:shadow-xl">
					<h2 className="text-lg font-semibold text-gray-800">House Temperature</h2>
					<div className="flex justify-between mx-3">
						<p className="text-3xl font-bold text-gray-900 mt-2">72°F</p>
						<p className="text-3xl font-bold text-gray-900 mt-2">53%</p>
					</div>
					<div className="mt-4 flex justify-between text-sm text-gray-600">
						<span>Living: 71°F</span>
						<span>Upstairs: 69°F</span>
					</div>
				</div>

				{/* Upcoming Events (1x2) */}
				<UpcomingEvents />

				{/* Spending (1x2) */}
				<SpendingCard />

				{/* Weekly Chores */}
				<WeeklyChores />

				{/* Home Assistant (1x1) */}
				<div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center transition-shadow duration-300 ease-in-out hover:shadow-xl">
					<h2 className="text-lg font-semibold text-gray-800 text-center">Home Assistant</h2>
					<button className="mt-4 w-full bg-white text-blue-600 py-2 rounded-lg shadow hover:shadow-md active:bg-stone-100 hover:cursor-pointer transition duration-200">
						Open Assistant
					</button>
				</div>

				{/* Manage Network (1x1) */}
				<div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-teal-50 to-teal-100 flex flex-col justify-center transition-shadow duration-300 ease-in-out hover:shadow-xl">
					<h2 className="text-lg font-semibold text-gray-800 text-center">Manage Network</h2>
					<button className="mt-4 w-full bg-white text-teal-600 py-2 rounded-lg shadow hover:shadow-md active:bg-stone-100 hover:cursor-pointer transition duration-200">
						Configure Wi-Fi
					</button>
				</div>

				{/* Shared Files (1x1) */}
				<div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 flex flex-col justify-center transition-shadow duration-300 ease-in-out hover:shadow-xl">
					<h2 className="text-lg font-semibold text-gray-800 text-center">Shared Files</h2>
					<a href="https://drive.google.com/drive/folders/1CBMhXttqoCN8xnErzPDrqLj0zizn5HrR?usp=sharing">
						<button className="mt-4 w-full bg-white text-purple-600 py-2 rounded-lg shadow hover:shadow-md active:bg-stone-100 hover:cursor-pointer transition duration-200">
							Open Files
						</button>
					</a>
				</div>

				{/* Expenses (1x1) */}
				<div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 flex flex-col justify-center transition-shadow duration-300 ease-in-out hover:shadow-xl">
					<h2 className="text-lg font-semibold text-gray-800 text-center">Expenses</h2>
					<button onClick={() => router.push('/dashboard/expenses')} className="mt-4 w-full bg-white text-amber-600 py-2 rounded-lg shadow hover:shadow-md active:bg-stone-100 hover:cursor-pointer transition duration-200">
						Open Expenses
					</button>
				</div>

			</div>

			{/* Notifications full width */}
			{/* Comment out notifications until implementation */}
			{/* <div className="mt-6 p-6 rounded-2xl shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 transition-shadow duration-300 ease-in-out hover:shadow-xl">
				<h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">Notifications</h2>
				<ul className="space-y-2 overflow-auto max-h-64 text-gray-800">
					{notifications.map((n, i) => (
						<li key={i} className="flex items-start space-x-3">
							<span className="mt-1 w-2 h-2 bg-gray-600 rounded-full flex-shrink-0"></span>
							<p>{n}</p>
						</li>
					))}
				</ul>
			</div> */}
			{showSettings && (
				<AccountSettingsModal
					user={{
						username: username,
						avatarUrl: avatarUrl,
						firstName: firstName,
						lastName: lastName,
						email: email,
						venmoUsername: venmoUsername,
					}}
					onClose={() => setShowSettings(false)}
				/>
			)}
		</div>
	)
}