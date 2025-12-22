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
		<div className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-blue-400/30 transition-all duration-300 space-y-4">
			<div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 dark:from-blue-400/40 dark:to-cyan-400/40 rounded-full blur-2xl"></div>
			
			<h2 className="relative text-sm font-semibold text-gray-600 dark:text-gray-400">Add Expense</h2>
			{submitError && <p className="relative text-red-500 dark:text-red-400 text-sm">{submitError}</p>}

			<input
				type="text"
				value={newExpense.description}
				onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
				placeholder="Description"
				className="relative w-full border border-gray-200/60 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
			/>

			<div className="relative flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
				<input
					type="text"
					inputMode="decimal"
					placeholder="Amount"
					value={newExpense.amount}
					onChange={handleAmountChange}
					onBlur={handleAmountBlur}
					className="flex-1 min-w-0 border border-gray-200/60 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
				/>
				<select
					value={newExpense.category}
					onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
					className="flex-1 min-w-0 border border-gray-200/60 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
				>
					<option value="">Select category</option>
					{categories.map(cat => (
						<option key={cat} value={cat}>{cat}</option>
					))}
				</select>
			</div>

			<div className="relative">
				<label className="text-sm text-gray-600 dark:text-gray-400 block mb-2 font-medium">Assign to</label>
				<div className="flex flex-wrap gap-2">
					{roommates.map(r => (
						<button
							key={r}
							onClick={() => toggleAssignee(r)}
							className={clsx(
								'px-3 py-1.5 rounded-xl text-sm font-medium transition-all',
								newExpense.assignees.includes(r)
									? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
									: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
							)}
						>
							{r}
						</button>
					))}
				</div>
			</div>

			{/* Recurrence toggle */}
			<div className="relative mt-4 space-y-4">
				<div className="flex items-center space-x-2">
					<input
						id="recurring"
						type="checkbox"
						checked={newExpense.recurring}
						onChange={() =>
							setNewExpense(prev => ({
								...prev,
								recurring: !prev.recurring,
								// clear the old day if turning off
								...(prev.recurring ? { dayOfMonth: '', dayOfWeek: '' } : {})
							}))
						}
						className="h-5 w-5 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded"
					/>
					<label htmlFor="recurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
						Mark this recurring
					</label>
				</div>

				{newExpense.recurring && (
					<div className="space-y-4">
						<div>
							<label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
										// when switching to weekly/monthly, default the day fields
										...(freq === 'weekly'
											? { dayOfWeek: prev.dayOfWeek || 'sunday', dayOfMonth: '' }
											: { dayOfMonth: prev.dayOfMonth || '1', dayOfWeek: '' }
										)
									}))
								}}
								className="w-full border border-gray-200/60 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
							>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
							</select>
						</div>

						{newExpense.frequency === 'weekly' && (
							<div>
								<label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Day of week
								</label>
								<select
									id="dayOfWeek"
									value={newExpense.dayOfWeek}
									onChange={e => setNewExpense(prev => ({ ...prev, dayOfWeek: e.target.value }))}
									className="w-full border border-gray-200/60 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white"
								>
									{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
										<option key={d} value={d.toLowerCase()}>{d}</option>
									))}
								</select>
							</div>
						)}

						{newExpense.frequency === 'monthly' && (
							<div>
								<label htmlFor="dayOfMonth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
									className="w-full border border-gray-200/60 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
								/>
							</div>
						)}
					</div>
				)}
			</div>

			<button
				onClick={submitExpense}
				className="relative w-full py-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:from-blue-700 hover:via-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300"
			>
				Add Expense
			</button>
		</div>
	)
}
