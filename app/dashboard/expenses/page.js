'use client'

// Imports
import { useState } from 'react'
import SpendingBarChart from '@/components/SpendingBarChart'
import YouOweCard from '@/components/YouOweCard'
import clsx from 'clsx'

export default function ExpensesPage() {
	/* 
	  All schemas/variables
	*/

	// Expense schema
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

	// Expense categories
	const categories = ['Rent', 'Utilities', 'Food', 'Entertainment', 'Other']

	// All roommates
	const roommates = ['Mathew', 'Nathan', 'Brycen', 'Michael']

	/*
	  Fake data
	*/

	// Fake category date (move to SQLite)
	const categoryData = [
		{ category: 'Utilities', value: 300 },
		{ category: 'Food', value: 450 },
		{ category: 'Other', value: 200 },
	]

	// Create list of pendingSettlements (what you owe others)
	const [pendingSettlements, setPendingSettlements] = useState([
		{ id: 1, assignedBy: 'Mathew', category: 'Rent', amount: 580 },
		{ id: 2, assignedBy: 'Nathan', category: 'Utilities', amount: 45 },
		{ id: 3, assignedBy: 'Brycen', category: 'Food', amount: 120 },
		{ id: 4, assignedBy: 'Michael', category: 'Other', amount: 75 },
	])

	// Transaction table for all transactions
	const [transactions, setTransactions] = useState([
		{ id: 1, date: '03/31', desc: 'Rent', category: 'Rent', amount: 2000, assignedTo: 'Mathew', createdBy: 'Nathan', paid: true },
		{ id: 2, date: '03/20', desc: 'Dinner', category: 'Entertainment', amount: 80, assignedTo: 'Nathan', createdBy: 'Mathew', paid: false },
		{ id: 3, date: '03/02', desc: 'Internet bill', category: 'Utilities', amount: 80, assignedTo: 'Brycen', createdBy: 'Michael', paid: true },
	])

	// Totals for how much you owe
	const youOwe = pendingSettlements.reduce((sum, s) => sum + s.amount, 0)
	const monthlyBudget = 500

	// What others owe you
	const pendingReceivables = transactions.filter(
		t => t.createdBy === 'Mathew' && !t.paid
	)
	const totalOwedToYou = pendingReceivables.reduce((sum, r) => sum + r.amount, 0)

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

	// Function to settle an expense
	function settle(id) {
		setPendingSettlements(ps => ps.filter(s => s.id !== id))
		// TODO: call Venmo API
	}


	// Function to export table as a CSV
	function exportCSV() {
		alert('Exporting transactions to CSV…')
	}

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
				<div className="bg-white rounded-2xl shadow p-6 space-y-4">
					<h2 className="text-lg font-medium text-gray-900">Add Expense</h2>
					<input
						type="text"
						value={newExpense.description}
						onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
						placeholder="Description"
						className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-300"
					/>
					<div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
						<input
							type="text"
							inputMode="decimal"
							placeholder="Amount"
							value={newExpense.amount}
							onChange={handleAmountChange}
							onBlur={handleAmountBlur}
							className="flex-1 min-w-0 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-300"
						/>
						<select
							value={newExpense.category}
							onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
							className="flex-1 min-w-0 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-300">
							{categories.map(cat => <option key={cat}>{cat}</option>)}
						</select>
					</div>
					{/* Assignees portion */}
					<div>
						<label className="text-sm text-gray-600 block mb-1">Assign to</label>
						<div className="flex flex-wrap gap-2">
							{roommates.map(r => (
								<button
									key={r}
									onClick={() => toggleAssignee(r)}
									className={clsx(
										'px-3 py-1 rounded-full text-sm font-medium',
										newExpense.assignees.includes(r)
											? 'bg-purple-100 text-purple-700'
											: 'bg-gray-100 text-gray-600'
									)}
								>{r}</button>
							))}
						</div>
					</div>
					{/* Recurrence portion */}
					<div className="mt-4 space-y-4">
						{/* Toggle recurrence */}
						<div className="flex items-center space-x-2">
							<input
								id="recurring"
								type="checkbox"
								checked={newExpense.recurring}
								onChange={() =>
									setNewExpense(prev => ({
										...prev,
										recurring: !prev.recurring,
										...(prev.recurring
											? { dayOfMonth: '', dayOfWeek: '' }
											: {}
										)
									}))
								}
								className="h-5 w-5 text-purple-600 border-gray-300 rounded"
							/>
							<label htmlFor="recurring" className="text-sm font-medium text-gray-700">
								Mark this recurring
							</label>
						</div>
						{/* Frequency selector */}
						{newExpense.recurring && (
							<div className="space-y-4">
								<div>
									<label
										htmlFor="frequency"
										className="block text-sm font-medium text-gray-700 mb-1">Frequency
									</label>
									<select
										id="frequency"
										value={newExpense.frequency}
										onChange={e =>
											setNewExpense(prev => ({
												...prev,
												frequency: e.target.value
											}))
										}
										className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-300">
										<option value="weekly">Weekly</option>
										<option value="monthly">Monthly</option>
									</select>
								</div>

								{/* Weekly: pick day of week */}
								{newExpense.frequency === 'weekly' && (
									<div>
										<label
											htmlFor="dayOfWeek"
											className="block text-sm font-medium text-gray-700 mb-1">
											Day of week
										</label>
										<select
											id="dayOfWeek"
											value={newExpense.dayOfWeek}
											onChange={e =>
												setNewExpense(prev => ({ ...prev, dayOfWeek: e.target.value }))
											}
											className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-300"
										>
											{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
												.map(d => (
													<option key={d} value={d.toLowerCase()}>
														{d}
													</option>
												))}
										</select>
									</div>
								)}

								{/* 3b. Monthly: pick day of month */}
								{newExpense.frequency === 'monthly' && (
									<div>
										<label
											htmlFor="dayOfMonth"
											className="block text-sm font-medium text-gray-700 mb-1"
										>
											Day of month
										</label>
										<input
											id="dayOfMonth"
											type="number"
											min={1}
											max={31}
											value={newExpense.dayOfMonth}
											onChange={e =>
												setNewExpense(prev => ({ ...prev, dayOfMonth: e.target.value }))
											}
											placeholder="e.g. 2"
											className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-300"
										/>
									</div>
								)}
							</div>
						)}
					</div>
					<button className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:opacity-90">
						Add Expense</button>
				</div>

				{/* You Owe Card */}
				<YouOweCard
					youOwe={youOwe}
					pendingSettlements={pendingSettlements}
				/>

				{/* Spending by category */}
				<div className="bg-white rounded-2xl shadow p-6 flex flex-col justify-start">
					<h2 className="text-lg font-medium text-gray-900 mb-4">
						Spending by category
					</h2>

					{/* Chart */}
					<div className="flex-1">
						<SpendingBarChart data={categoryData} />
					</div>

					{/* Legend */}
					<div className="mb-3 grid grid-cols-2 gap-4">
						{(() => {
							const total = categoryData.reduce((sum, { value }) => sum + value, 0)
							return categoryData.map((item) => {
								const pct = Math.round((item.value / total) * 100)
								return (
									<div key={item.category} className="flex items-center space-x-2">
										<span
											className={clsx(
												'w-3 h-3 rounded-full flex-shrink-0',
												item.category === 'Food' ? 'bg-yellow-500' :
													item.category === 'Utilities' ? 'bg-blue-500' :
														'bg-purple-500'
											)}
										/>
										<span className="text-sm text-gray-700">
											{item.category}: ${item.value.toLocaleString()} ({pct}%)
										</span>
									</div>
								)
							})
						})()}
					</div>
				</div>
			</div>

			{/* BOTTOM GRID */}
			<div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-1 gap-6">

				{/* Pending Settlements */}
				<div className="lg:row-span-2 bg-indigo-50 rounded-2xl shadow p-6 flex flex-col">
					<h2 className="text-lg font-medium text-gray-900 mb-4">Pending Settlements</h2>
					<div
						className="
             bg-white
             rounded-lg
             p-6
             space-y-4
             shadow-inner
             overflow-y-auto     /* enable vertical scroll */
             flex-1
             max-h-80            /* cap height (e.g. 20rem) */
           "
					>
						{pendingSettlements.map(s => (
							<div key={s.id} className="flex justify-between items-center">
								<div>
									<p className="text-gray-800 font-medium">{s.assignedBy}</p>
									<p className="text-sm text-gray-500">{s.category}</p>
								</div>
								<div className="flex items-center space-x-4">
									<span className="text-gray-800 font-semibold">
										${s.amount.toFixed(2)}
									</span>
									<button
										onClick={() => settle(s.id)}
										className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
									>Settle</button>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* You Are Owed */}
				<div className="bg-white rounded-2xl shadow p-6 flex flex-col">
					<h2 className="text-lg font-medium text-gray-900">You Are Owed</h2>

					<p className="text-3xl font-bold text-gray-900">
						${totalOwedToYou.toFixed(2)}
					</p>
					<p className="text-sm text-gray-600">
						{pendingReceivables.length} pending{' '}
						{pendingReceivables.length === 1 ? 'item' : 'items'}
					</p>

					{/* Progress bar */}
					<div className="w-full bg-gray-200 rounded-full h-2 mt-2">
						<div
							className="h-2 bg-blue-600 rounded-full"
							style={{
								width: `${Math.min((totalOwedToYou / monthlyBudget) * 100, 100)}%`
							}}
						/>
					</div>

					{/* Detailed List */}
					<div className="mt-4 overflow-y-auto max-h-48 divide-y divide-gray-200">
						{pendingReceivables.map((r) => (
							<div
								key={r.id}
								className="py-3 flex justify-between items-center"
							>
								<div>
									<p className="font-medium text-gray-800">{r.desc}</p>
									<p className="text-xs text-gray-500">
										Owed by {r.assignedTo}
									</p>
								</div>

								<div className="flex items-center space-x-6">
									<span className="font-semibold text-gray-800">
										${r.amount.toFixed(2)}
									</span>

									<button
										onClick={() => markPaid(r.id)}
										className="
                      px-4 py-1 
                      bg-gradient-to-r from-purple-600 to-blue-400 
                      text-white text-sm 
                      rounded-full 
                      hover:opacity-90 
                      transition
                    ">
										Mark Paid
									</button>
								</div>
							</div>
						))}
					</div>

				</div>

			</div>

			{/* All Transactions */}
			<div className="lg:row-span-2 bg-white rounded-2xl shadow p-6 overflow-x-auto">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-lg font-medium text-gray-900">All Transactions</h2>
					<button
						onClick={exportCSV}
						className="text-sm text-indigo-600 hover:underline"
					>Export CSV</button>
				</div>
				<table className="w-full text-left table-auto">
					<thead>
						<tr className="border-b">
							{['Date', 'Description', 'Category', 'Amount', 'Assigned to', 'Created by', 'Paid'].map(h => (
								<th key={h} className="py-2 px-3 text-sm text-gray-600">{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{transactions.map(t => (
							<tr key={t.id} className="hover:bg-gray-50">
								<td className="py-2 px-3 text-gray-800 text-sm">{t.date}</td>
								<td className="py-2 px-3 text-gray-800 text-sm">{t.desc}</td>
								<td className="py-2 px-3 text-gray-800 text-sm">{t.category}</td>
								<td className="py-2 px-3 text-gray-800 text-sm">${t.amount}</td>
								<td className="py-2 px-3 text-gray-800 text-sm">{t.assignedTo}</td>
								<td className="py-2 px-3 text-gray-800 text-sm">{t.createdBy}</td>
								<td className="py-2 px-3 text-center text-lg">
									{t.paid ? '✓' : '✗'}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
