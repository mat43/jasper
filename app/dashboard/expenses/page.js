'use client'

// Imports
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import SpendingBarChart from '@/components/SpendingBarChart'
import YouOweCard from '@/components/YouOweCard'
import AddExpenseCard from '@/components/AddExpenseCard';
import TransactionsTable from '@/components/TransactionsTable';
import RecurringRulesTable from '@/components/RecurringRulesTable'
import YouAreOwedCard from '@/components/YouAreOwedCard'
import PendingSettlementsCard from '@/components/PendingSettlementsCard'
import { FiDollarSign, FiPieChart, FiTrendingUp } from 'react-icons/fi'
import clsx from 'clsx'

export default function ExpensesPage() {
	/* 
	  All schemas/variables
	*/

	// Expense schema
	const { data: session, status } = useSession()

	const [newExpense, setNewExpense] = useState({
		description: '',
		amount: '',
		category: 'Rent',
		assignees: [],
		recurring: false,
		frequency: 'monthly',   // default
		dayOfMonth: '',         // for monthly
		dayOfWeek: ''           // for weekly
	})

	const [view, setView] = useState('all')

	// Expense categories
	const categories = ['Rent', 'Utilities', 'Food', 'Entertainment', 'Other']

	// All roommates
	const roommates = ['Mathew', 'Nathan', 'Brycen', 'Michael']

	// Create list of pendingSettlements (what you owe others)
	const [pendingSettlements, setPendingSettlements] = useState([])
	const [templates, setTemplates] = useState([])
	const [transactions, setTransactions] = useState([])

	/*
	  Helper functions
	*/

	// Remove any leading $, enforce digits + up to 2 decimals for dollar amounts
	function handleAmountChange(e) {
		let val = e.target.value.replace(/^\$/, '')
		if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
			setNewExpense(prev => ({ ...prev, amount: val }))
		}
	}

	// Parse and prefix $ for expenses box
	function handleAmountBlur() {
		const num = parseFloat(newExpense.amount)
		if (!isNaN(num)) {
			const formatted = num.toFixed(2)
			setNewExpense(prev => ({ ...prev, amount: `$${formatted}` }))
		} else {
			setNewExpense(prev => ({ ...prev, amount: '' }))
		}
	}

	// Mark as paid in you are owed box
	function markPaid(id) {
		setTransactions(prev =>
			prev.map(tx =>
				tx.id === id ? { ...tx, paid: true } : tx
			)
		)
	}

	// Toggle assignees 
	function toggleAssignee(name) {
		setNewExpense(prev => ({
			...prev,
			assignees: prev.assignees.includes(name)
				? prev.assignees.filter(n => n !== name)
				: [...prev.assignees, name]
		}))
	}

	async function fetchExpenses() {
		const res = await fetch('/api/expenses')
		const data = await res.json()
		setTransactions(data)
	}

	async function fetchTemplates() {
		const res = await fetch('/api/templates')
		const data = await res.json()
		setTemplates(data)
	}

	// fetch templates & expenses on page load
	// (useEffect runs on client-side)
	useEffect(() => {
		fetch('/api/templates')
			.then(r => r.json())
			.then(setTemplates)
			.catch(console.error)
	}, [])

	useEffect(() => {
		fetch('/api/expenses')
			.then(r => r.json())
			.then(setTransactions)
			.catch(console.error)
	}, [])

	if (status === 'loading') return <p>Loading...</p>

	if (status === 'unauthenticated') {
		router.push('/api/auth/login')
		return null
	}

	const currentUser = session?.user?.username

	/*
	  Page content
	*/
	return (
		// Main div for full page
		<div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
			<h1 className="text-3xl font-semibold text-gray-800">Expenses</h1>

			{/* Top row */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

				{/* Add expense button */}
				<AddExpenseCard
					newExpense={newExpense}
					setNewExpense={setNewExpense}
					categories={categories}
					roommates={roommates}
					handleAmountChange={handleAmountChange}
					handleAmountBlur={handleAmountBlur}
					toggleAssignee={toggleAssignee}
					onSuccess={() => {
						fetchExpenses()
						fetchTemplates()
					}}
				/>

				{/* You Owe Card */}
				<YouOweCard
					transactions={transactions}
					currentUser={currentUser}
					onSettle={id =>
						setTransactions(ts => ts.map(t =>
							t.id === id ? { ...t, paid: true } : t
						))
					}
				/>

				{/* Spending by category */}
				<div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col space-y-4">
					<h2 className="text-base font-semibold text-gray-900 mb-3">
						Spending by category
					</h2>

					{/* Chart */}
					<div className="mb-4">
						<SpendingBarChart transactions={transactions} />
					</div>

					{/* Mid-size stats row */}
					<div className="flex justify-between space-x-2">
						{(() => {
							// Agg & compute
							const totals = transactions.reduce((acc, tx) => {
								acc[tx.category] = (acc[tx.category] || 0) + tx.amount
								return acc
							}, {})
							const sumAll = Object.values(totals).reduce((a, b) => a + b, 0)
							const entries = Object.entries(totals).sort((a, b) => b[1] - a[1])
							const [topCat, topVal] = entries[0] || ['—', 0]
							const avgPerCat = sumAll / (entries.length || 1)

							const stats = [
								{ icon: FiDollarSign, label: 'Total', value: `$${sumAll.toLocaleString()}`, bg: 'bg-purple-50', txt: 'text-purple-600' },
								{ icon: FiPieChart, label: 'Top', value: `${topCat}`, bg: 'bg-indigo-50', txt: 'text-indigo-600' },
								{ icon: FiTrendingUp, label: 'Avg', value: `$${avgPerCat.toFixed(2)}`, bg: 'bg-green-50', txt: 'text-green-600' },
							]

							return stats.map(({ icon: Icon, label, value, bg, txt }) => (
								<div key={label}
									className={`${bg} flex-1 flex items-center p-2 rounded-lg`}>
									<Icon className={`w-5 h-5 ${txt}`} />
									<div className="ml-2">
										<p className="text-xs text-gray-500">{label}</p>
										<p className="text-sm font-medium text-gray-900">{value}</p>
									</div>
								</div>
							))
						})()}
					</div>
				</div>
			</div>

			{/* BOTTOM GRID */}
			<div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-1 gap-6">

				{/* Pending Settlements */}
				<PendingSettlementsCard
					transactions={transactions}
					currentUser={currentUser}
					onSettle={id =>
						setTransactions(ts =>
							ts.map(t => (t.id === id ? { ...t, paid: true } : t))
						)
					}
				/>
				{/* You Are Owed Card */}
				<YouAreOwedCard
					transactions={transactions}
					currentUser={currentUser}
					onMarkPaid={markPaid}
				/>

			</div>

			{/* ➤ Toggle buttons */}
			<div className="flex space-x-4">
				<button
					onClick={() => setView('all')}
					className={clsx(
						'px-4 py-2 rounded-lg',
						view === 'all'
							? 'bg-indigo-600 text-white'
							: 'bg-gray-100 text-gray-700'
					)}
				>
					All Transactions
				</button>
				<button
					onClick={() => setView('recurring')}
					className={clsx(
						'px-4 py-2 rounded-lg',
						view === 'recurring'
							? 'bg-indigo-600 text-white'
							: 'bg-gray-100 text-gray-700'
					)}
				>
					Recurring Rules
				</button>
			</div>

			{/* ➤ Conditionally render the two tables */}
			{view === 'all' ? (
				<TransactionsTable
					transactions={transactions}
					onDelete={id => setTransactions(ts => ts.filter(t => t.id !== id))}
				/>
			) : (
				<RecurringRulesTable
					templates={templates}
					onDeleteTemplate={async id => {
						try {
							const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
							if (!res.ok) throw new Error('Delete failed')
							setTemplates(tpl => tpl.filter(t => t.id !== id))
						} catch (err) {
							console.error('Failed to delete template', err)
							alert('Could not delete this recurrence rule.')
						}
					}}
				/>
			)}
		</div>
	)
}
