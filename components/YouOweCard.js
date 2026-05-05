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
		<div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200 space-y-4">
			<div className="flex items-center space-x-2">
				<CurrencyDollarIcon className="w-6 h-6 text-emerald-500" />
				<p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">You Owe</p>
			</div>

			<p className="text-4xl font-bold text-gray-900">${youOwe.toFixed(2)}</p>

			<div className="flex flex-wrap gap-2">
				{categoriesOwed.map(cat => (
					<span
						key={cat}
						className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium"
					>
						{cat}
					</span>
				))}
			</div>

			<p className="text-sm text-gray-500">
				{numItems} pending {numItems === 1 ? 'item' : 'items'}, largest ${largestPending}
			</p>

			<div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
				<div
					className="h-1.5 bg-emerald-500 rounded-full transition-all duration-500"
					style={{ width: `${percentPaid}%` }}
				/>
			</div>
		</div>
	)
}
