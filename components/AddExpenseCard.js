'use client'

import React, { useState } from 'react'
import clsx from 'clsx'

export default function AddExpenseCard({
	newExpense,
	setNewExpense,
	categories,
	roommates,
	handleAmountChange,
	handleAmountBlur,
	toggleAssignee,
	onSuccess
}) {
	const [submitError, setSubmitError] = useState('')

	async function submitExpense() {
		const {
			description,
			amount,
			assignees,
			recurring,
			frequency,
			dayOfMonth,
			dayOfWeek,
			category
		} = newExpense

		setSubmitError('')

		// 1) Basic validation
		if (!description.trim() || !amount) {
			setSubmitError('Please enter both a description and an amount.')
			return
		}
		if (!category) {
			setSubmitError('Please select a category.')
			return
		}
		if (recurring) {
			if (!frequency) {
				setSubmitError('Please select a frequency for recurring expenses.')
				return
			}
			if (frequency === 'monthly' && !dayOfMonth) {
				setSubmitError('Please select a day of month for recurring expenses.')
				return
			}
			if (frequency === 'weekly' && !dayOfWeek) {
				setSubmitError('Please select a day of week for recurring expenses.')
				return
			}
		}

		// 2) Normalize amount
		const numAmount = parseFloat(
			typeof amount === 'string'
				? amount.replace(/[^0-9.-]+/g, '')
				: amount
		)
		if (isNaN(numAmount)) {
			setSubmitError('Amount must be a valid number.')
			return
		}

		// 3) Decide recipients
		const targets = assignees.length > 0 ? assignees : [null]

		// 4) Split total into rounded-up shares
		const totalCents = Math.round(numAmount * 100)
		const count = targets.length
		const splitCents = Math.ceil(totalCents / count)
		const centsArray = targets.map(() => splitCents)

		const errors = []

		// 5) One POST per target, using the split amount
		for (let i = 0; i < targets.length; i++) {
			const assignee = targets[i]
			const payload = {
				description,
				amount: centsArray[i] / 100,
				category,
				assignees: assignee ? [assignee] : []
			}

			if (recurring) {
				payload.frequency = frequency
				if (frequency === 'monthly') {
					payload.dayOfMonth = parseInt(dayOfMonth, 10)
				} else {
					payload.dayOfWeek = dayOfWeek
				}
			}

			try {
				const url = recurring ? '/api/templates' : '/api/expenses'
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				})

				if (!res.ok) {
					const text = await res.text().catch(() => '')
					console.error(`POST ${url} failed:`, res.status, text)
					throw new Error(
						text ||
						`Failed to add ${recurring ? 'recurring rule' : 'expense'} for ${assignee || 'no one'}`
					)
				}
			} catch (err) {
				console.error(err)
				errors.push(err.message)
			}
		}

		// 6) Handle errors or success
		if (errors.length) {
			setSubmitError(errors.join('; '))
			return
		}

		setNewExpense({
			description: '',
			amount: '',
			category: '',
			assignees: [],
			recurring: false,
			frequency: 'monthly',
			dayOfMonth: '',
			dayOfWeek: ''
		})
		onSuccess?.()
	}

	return (
		<div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200 space-y-4">
			<p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Add Expense</p>
			{submitError && <p className="text-red-500 text-sm">{submitError}</p>}

			<input
				type="text"
				value={newExpense.description}
				onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
				placeholder="Description"
				className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-gray-900 placeholder-gray-400"
			/>

			<div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
				<input
					type="text"
					inputMode="decimal"
					placeholder="Amount"
					value={newExpense.amount}
					onChange={handleAmountChange}
					onBlur={handleAmountBlur}
					className="flex-1 min-w-0 border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-gray-900 placeholder-gray-400"
				/>
				<select
					value={newExpense.category}
					onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
					className="flex-1 min-w-0 border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-gray-900"
				>
					<option value="">Select category</option>
					{categories.map(cat => (
						<option key={cat} value={cat}>{cat}</option>
					))}
				</select>
			</div>

			<div>
				<label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">Assign to</label>
				<div className="flex flex-wrap gap-2">
					{roommates.map(r => (
						<button
							key={r.username}
							onClick={() => toggleAssignee(r.username)}
							className={clsx(
								'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150',
								newExpense.assignees.includes(r.username)
									? 'bg-blue-100 text-blue-700'
									: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
							)}
						>
							{r.name?.split(' ')[0] ?? r.username}
						</button>
					))}
				</div>
			</div>

			{/* Recurrence toggle */}
			<div className="mt-4 space-y-4">
				<div className="flex items-center space-x-2">
					<input
						id="recurring"
						type="checkbox"
						checked={newExpense.recurring}
						onChange={() =>
							setNewExpense(prev => ({
								...prev,
								recurring: !prev.recurring,
								...(prev.recurring ? { dayOfMonth: '', dayOfWeek: '' } : {})
							}))
						}
						className="h-5 w-5 text-blue-600 border-gray-300 rounded"
					/>
					<label htmlFor="recurring" className="text-sm font-medium text-gray-700">
						Mark this recurring
					</label>
				</div>

				{newExpense.recurring && (
					<div className="space-y-4">
						<div>
						<label htmlFor="frequency" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
							Frequency
						</label>
						<select
							id="frequency"
							value={newExpense.frequency}
							onChange={e => {
								const freq = e.target.value
								setNewExpense(prev => ({
									...prev,
									frequency: freq,
									...(freq === 'weekly'
										? { dayOfWeek: prev.dayOfWeek || 'sunday', dayOfMonth: '' }
										: { dayOfMonth: prev.dayOfMonth || '1', dayOfWeek: '' }
									)
								}))
							}}
							className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-gray-900"
							>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
							</select>
						</div>

						{newExpense.frequency === 'weekly' && (
							<div>
								<label htmlFor="dayOfWeek" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
									Day of week
								</label>
								<select
									id="dayOfWeek"
									value={newExpense.dayOfWeek}
									onChange={e => setNewExpense(prev => ({ ...prev, dayOfWeek: e.target.value }))}
									className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-gray-900"
								>
									{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
										<option key={d} value={d.toLowerCase()}>{d}</option>
									))}
								</select>
							</div>
						)}

						{newExpense.frequency === 'monthly' && (
							<div>
								<label htmlFor="dayOfMonth" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
									Day of month
								</label>
								<input
									id="dayOfMonth"
									type="number"
									min={1}
									max={31}
									value={newExpense.dayOfMonth}
									onChange={e => setNewExpense(prev => ({ ...prev, dayOfMonth: e.target.value }))}
									placeholder="e.g. 2"
									className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-gray-900 placeholder-gray-400"
								/>
							</div>
						)}
					</div>
				)}
			</div>

			<button
				onClick={submitExpense}
				className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-150"
			>
				Add Expense
			</button>
		</div>
	)
}
