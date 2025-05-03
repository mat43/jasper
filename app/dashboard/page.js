'use client'

// Imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckIcon } from '@heroicons/react/24/solid'
import ProfileCard from '@/components/ProfileCard'
import SpendingBarChart from '@/components/SpendingBarChart'
import AccountSettingsModal from '@/components/AccountSettingsModal';
import { useSession, signOut } from 'next-auth/react';
import WeatherWidget from '@/components/WeatherWidget';
import UpcomingEvents from '@/components/UpcomingEvents';

/**
 * read a key from localStorage on mount and keep it in state,
 * then write it back whenever it changes.
 */
function useLocalStorage(key, initialValue) {
	const [storedValue, setStoredValue] = useState(initialValue)

	// on mount, read the value
	useEffect(() => {
		try {
			const item = window.localStorage.getItem(key)
			if (item !== null) {
				setStoredValue(JSON.parse(item))
			}
		} catch (err) {
			console.error(`Failed to load ${key} from localStorage`, err)
		}
	}, [key])

	// whenever it changes, write it
	useEffect(() => {
		try {
			window.localStorage.setItem(key, JSON.stringify(storedValue))
		} catch (err) {
			console.error(`Failed to save ${key} to localStorage`, err)
		}
	}, [key, storedValue])

	return [storedValue, setStoredValue]
}

// We just store name in database, so split it up
function splitName(fullName) {
	const [firstName, ...rest] = fullName.trim().split(' ')
	return { firstName, lastName: rest.join(' ') }
}

export default function HomePage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	const [notifications] = useState([
		'Brycen paid Michael $25 for rent',
		'Water leak detected',
		'Who ate the last slice of pizza',
		'New login from unknown device',
	])
	const [showSettings, setShowSettings] = useState(false);

	const defaultChores = [
		{ label: 'Take out trash', done: false },
		{ label: 'Clean kitchen', done: false },
		{ label: 'Clean restroom', done: false },
		{ label: 'Mow the lawn', done: false },
		{ label: 'Sweep floors', done: false },
		{ label: 'Mop floors', done: false },
		{ label: 'Clean out fridge', done: false },
		{ label: 'Clean oven', done: false },
	]

	const categoryBreakdown = [
		{ category: 'Groceries', value: 1200 },
		{ category: 'Rent', value: 1500 },
		{ category: 'Utilities', value: 400 },
		{ category: 'Entertainment', value: 350 },
	]

	const [tasks, setTasks] = useLocalStorage('weeklyChores', defaultChores)

	function toggleTask(index) {
		setTasks((prev) =>
			prev.map((t, i) =>
				i === index ? { ...t, done: !t.done } : t
			)
		)
	}

	useEffect(() => {
		localStorage.setItem('weeklyChores', JSON.stringify(tasks))
	}, [tasks])

	const [events] = useState([
		{ label: 'Rent due', time: 'Today' },
		{ label: 'Meeting with landlord', time: '3:00 pm' },
		{ label: 'Family dinner', time: 'Tuesday at 4:00pm' },
	])

	const totalThisMonth = 3450
	const roommates = 5
	const avgPerPerson = (totalThisMonth / roommates).toFixed(2)
	const topCategory = 'Groceries'
	const topCategoryAmount = 1200

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
				<div className="row-span-2 col-span-1 p-6 rounded-2xl shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 flex flex-col justify-between transition-shadow duration-300 ease-in-out hover:shadow-xl">
					<h2 className="text-lg font-semibold text-gray-800 text-center">Spending in April</h2>
					{/* Chart */}
					<SpendingBarChart data={categoryBreakdown} />
					{/* or, instead of the progress bar, do: */}
					<div className="mt-4">
						<h3 className="text-sm font-medium text-gray-700 mb-2">
							Latest Transactions
						</h3>
						<ul className="space-y-1 text-gray-600 text-sm">
							{[
								{ label: 'Rent', amount: 1500 },
								{ label: 'Groceries', amount: 1200 },
								{ label: 'Utilities', amount: 400 }
							].map((t, i) => (
								<li key={i} className="flex justify-between">
									<span>{t.label}</span>
									<span>${t.amount}</span>
								</li>
							))}
						</ul>
					</div>

					<div className="mt-6 flex flex-col sm:flex-row sm:justify-around text-sm text-gray-600 space-y-2 sm:space-y-0">
						<span>Avg/person: ${avgPerPerson}</span>
						<span>Top Category: {topCategory} (${topCategoryAmount})</span>
					</div>
				</div>

				{/* Weekly Chores */}
				<div className="row-span-2 p-6 rounded-2xl shadow-lg bg-gradient-to-br from-pink-50 to-pink-100 flex flex-col transition-shadow duration-300 ease-in-out hover:shadow-xl">
					<h2 className="text-lg font-semibold text-gray-800">Weekly Chores</h2>
					<ul className="mt-4 space-y-2">
						{tasks.map((task, idx) => (
							<li
								key={idx}
								onClick={() => toggleTask(idx)}
								className="flex items-center cursor-pointer select-none"
							>
								<CheckIcon
									className={`w-5 h-5 flex-shrink-0 ${task.done ? 'text-green-500' : 'text-gray-300'
										}`} />
								<span
									className={`ml-2 ${task.done ? 'line-through text-gray-500' : ''
										}`}>
									{task.label}
								</span>
							</li>
						))}
					</ul>
				</div>

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
			<div className="mt-6 p-6 rounded-2xl shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 transition-shadow duration-300 ease-in-out hover:shadow-xl">
				<h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">Notifications</h2>
				<ul className="space-y-2 overflow-auto max-h-64 text-gray-800">
					{notifications.map((n, i) => (
						<li key={i} className="flex items-start space-x-3">
							<span className="mt-1 w-2 h-2 bg-gray-600 rounded-full flex-shrink-0"></span>
							<p>{n}</p>
						</li>
					))}
				</ul>
			</div>
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