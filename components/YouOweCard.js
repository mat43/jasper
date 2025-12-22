// components/YouOweCard.jsx
'use client'

import React from 'react'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'

export default function YouOweCard({
	transactions = [],
	currentUser
}) {
	// parse JSON-string assignees
	function getAssignees(arr) {
		try {
			return Array.isArray(arr) ? arr : JSON.parse(arr || '[]')
		} catch {
			return []
		}
	}

	// all entries where you are an assignee
	const allForYou = transactions.filter(t => {
		const assignees = getAssignees(t.assignees)
		return assignees.includes(currentUser)
	})

	// unpaid subset
	const pending = allForYou.filter(t => !t.paid)

	// totals
	const totalAll = allForYou.reduce((sum, t) => sum + t.amount, 0)
	const youOwe = pending.reduce((sum, t) => sum + t.amount, 0)
	const numItems = pending.length
	const categoriesOwed = Array.from(new Set(pending.map(t => t.category)))
	const largestPending = numItems ? Math.max(...pending.map(t => t.amount)) : 0

	// % paid = (totalAll - youOwe) / totalAll * 100
	const percentPaid = totalAll > 0
		? ((totalAll - youOwe) / totalAll) * 100
		: 0

	return (
		<div className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-2xl p-6 hover:shadow-2xl hover:shadow-emerald-500/20 dark:hover:shadow-emerald-400/30 transition-all duration-300 space-y-4">
			<div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 dark:from-emerald-400/40 dark:to-teal-400/40 rounded-full blur-2xl"></div>
			
			<div className="relative flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<CurrencyDollarIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
					<h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">You Owe</h3>
				</div>
			</div>

			<p className="relative text-4xl font-bold text-gray-900 dark:text-white">${youOwe.toFixed(2)}</p>

			<div className="relative flex flex-wrap gap-2">
				{categoriesOwed.map(cat => (
					<span
						key={cat}
						className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full font-medium"
					>
						{cat}
					</span>
				))}
			</div>

			<div className="relative text-sm text-gray-600 dark:text-gray-400">
				{numItems} pending {numItems === 1 ? 'item' : 'items'}, largest ${largestPending}
			</div>

			<div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
				<div
					className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
					style={{ width: `${percentPaid}%` }}
				/>
			</div>
		</div>
	)
}
