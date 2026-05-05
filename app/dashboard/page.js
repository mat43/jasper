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
						<h1 className="text-3xl font-bold text-gray-900">
							Welcome back, {firstName}
						</h1>
						<p className="text-gray-500 mt-1">Here's your overview for today</p>
					</div>
				</div>
			</div>

			{/* Grid */}
			<div className="max-w-7xl mx-auto px-6">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

				{/* Profile (1x1) */}
				<ProfileCard
					name={me.name}
					avatarUrl={me.avatarUrl}
					settingsOptions={me.settingsOptions}
				/>

				{/* Weather (1x1) */}
				<WeatherWidget />

				{/* Climate (1x1) */}
				<div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
					<p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Climate</p>
					<div className="flex justify-between items-center">
						<div>
							<p className="text-5xl font-bold text-gray-900 leading-none">72°</p>
							<p className="text-sm text-gray-400 mt-2">Temperature</p>
						</div>
						<div className="text-right">
							<p className="text-4xl font-bold text-blue-500 leading-none">53%</p>
							<p className="text-sm text-gray-400 mt-2">Humidity</p>
						</div>
					</div>
					<div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
						<div className="bg-gray-50 rounded-xl px-3 py-2">
							<p className="text-xs text-gray-400">Living</p>
							<p className="text-sm font-semibold text-gray-700">71°</p>
						</div>
						<div className="bg-gray-50 rounded-xl px-3 py-2">
							<p className="text-xs text-gray-400">Upstairs</p>
							<p className="text-sm font-semibold text-gray-700">69°</p>
						</div>
					</div>
				</div>

				{/* Upcoming Events */}
				<UpcomingEvents />

				{/* Spending (spans 2 rows) */}
				<SpendingCard />

				{/* Grocery List (spans 2 rows) */}
				<GroceryList />

				{/* Home Assistant */}
				<button
					onClick={() => {}}
					className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-shadow duration-200 flex flex-col text-left"
				>
					<div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
						<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
						</svg>
					</div>
					<p className="text-xs text-gray-400 mb-0.5">Automations</p>
					<p className="font-semibold text-gray-900">Home Assistant</p>
					<p className="text-xs text-blue-500 font-medium mt-auto pt-3">Open →</p>
				</button>

				{/* Network */}
				<button
					onClick={() => {}}
					className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-teal-200 transition-shadow duration-200 flex flex-col text-left"
				>
					<div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mb-3">
						<svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
						</svg>
					</div>
					<p className="text-xs text-gray-400 mb-0.5">Router & Devices</p>
					<p className="font-semibold text-gray-900">Network</p>
					<p className="text-xs text-teal-500 font-medium mt-auto pt-3">Configure →</p>
				</button>

				{/* Shared Files */}
				<a
					href="https://drive.google.com/drive/folders/1CBMhXttqoCN8xnErzPDrqLj0zizn5HrR?usp=sharing"
					className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-violet-200 transition-shadow duration-200 flex flex-col"
				>
					<div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mb-3">
						<svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
						</svg>
					</div>
					<p className="text-xs text-gray-400 mb-0.5">Google Drive</p>
					<p className="font-semibold text-gray-900">Shared Files</p>
					<p className="text-xs text-violet-500 font-medium mt-auto pt-3">Open →</p>
				</a>

				{/* Expenses */}
				<button
					onClick={() => router.push('/dashboard/expenses')}
					className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-amber-200 transition-shadow duration-200 flex flex-col text-left"
				>
					<div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
						<svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<p className="text-xs text-gray-400 mb-0.5">Shared Costs</p>
					<p className="font-semibold text-gray-900">Expenses</p>
					<p className="text-xs text-amber-500 font-medium mt-auto pt-3">View →</p>
				</button>

			</div>
		</div>

			{/* Notifications full width */}
			{/* Comment out notifications until implementation */}
			{/* <div className="mt-6 p-6 rounded-2xl shadow-lg bg-linear-to-br from-gray-50 to-gray-100 transition-shadow duration-300 ease-in-out hover:shadow-xl">
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