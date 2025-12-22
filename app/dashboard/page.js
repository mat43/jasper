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
import GroceryList from '@/components/GroceryList';
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
		<div className="min-h-full py-8">
			{/* Header */}
			<div className="max-w-7xl mx-auto px-6 mb-8">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
							Welcome back, {firstName}
						</h1>
						<p className="text-gray-600 dark:text-gray-400 mt-2">Here's your overview for today</p>
					</div>
				</div>
			</div>

			{/* Grid */}
			<div className="max-w-7xl mx-auto px-6">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-fr">
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
				<div className="group relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 hover:shadow-xl hover:shadow-rose-500/5 dark:hover:shadow-rose-500/10 transition-all duration-300">
					<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-pink-500/10 dark:from-rose-500/20 dark:to-pink-500/20 rounded-full blur-3xl"></div>
					<h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Climate Control</h2>
					<div className="relative flex justify-between items-end">
						<div>
							<p className="text-5xl font-bold text-gray-900 dark:text-white">72°</p>
							<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Temperature</p>
						</div>
						<div className="text-right">
							<p className="text-4xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">53%</p>
							<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Humidity</p>
						</div>
					</div>
					<div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800 flex justify-between text-sm text-gray-600 dark:text-gray-400">
						<span>Living: 71°</span>
						<span>Upstairs: 69°</span>
					</div>
				</div>

				{/* Upcoming Events (1x2) */}
				<UpcomingEvents />

				{/* Spending (1x2) */}
				<SpendingCard />

				{/* Grocery List */}
				<GroceryList />

				{/* Home Assistant (1x1) */}
				<div className="group relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-center">
					<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 rounded-full blur-3xl"></div>
					<div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 mx-auto shadow-lg shadow-blue-500/30">
						<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
						</svg>
					</div>
					<h2 className="text-base font-semibold text-gray-900 dark:text-white text-center mb-4">Home Assistant</h2>
					<button className="relative w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300">
						Open
					</button>
				</div>

				{/* Manage Network (1x1) */}
				<div className="group relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 hover:shadow-xl hover:shadow-teal-500/5 dark:hover:shadow-teal-500/10 transition-all duration-300 flex flex-col justify-center">
					<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 dark:from-teal-500/20 dark:to-cyan-500/20 rounded-full blur-3xl"></div>
					<div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center mb-4 mx-auto shadow-lg shadow-teal-500/30">
						<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
						</svg>
					</div>
					<h2 className="text-base font-semibold text-gray-900 dark:text-white text-center mb-4">Network</h2>
					<button className="relative w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white py-3 px-4 rounded-xl font-medium shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all duration-300">
						Configure
					</button>
				</div>

				{/* Shared Files (1x1) */}
				<div className="group relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 hover:shadow-xl hover:shadow-purple-500/5 dark:hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-center">
					<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-violet-500/10 dark:from-purple-500/20 dark:to-violet-500/20 rounded-full blur-3xl"></div>
					<div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mb-4 mx-auto shadow-lg shadow-purple-500/30">
						<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
						</svg>
					</div>
					<h2 className="text-base font-semibold text-gray-900 dark:text-white text-center mb-4">Shared Files</h2>
					<a href="https://drive.google.com/drive/folders/1CBMhXttqoCN8xnErzPDrqLj0zizn5HrR?usp=sharing" className="block">
						<button className="relative w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white py-3 px-4 rounded-xl font-medium shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300">
							Open
						</button>
					</a>
				</div>

				{/* Expenses (1x1) */}
				<div className="group relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 hover:shadow-xl hover:shadow-amber-500/5 dark:hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-center">
					<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 rounded-full blur-3xl"></div>
					<div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 mx-auto shadow-lg shadow-amber-500/30">
						<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<h2 className="text-base font-semibold text-gray-900 dark:text-white text-center mb-4">Expenses</h2>
					<button onClick={() => router.push('/dashboard/expenses')} className="relative w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-3 px-4 rounded-xl font-medium shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300">
						Open
					</button>
				</div>

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