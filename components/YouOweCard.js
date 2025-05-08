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
		<div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-6 space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<CurrencyDollarIcon className="w-8 h-8 text-green-600" />
					<h3 className="text-lg font-semibold text-gray-800">You Owe</h3>
				</div>
			</div>

			<p className="text-4xl font-bold text-gray-900">${youOwe.toFixed(2)}</p>

			<div className="flex flex-wrap gap-2">
				{categoriesOwed.map(cat => (
					<span
						key={cat}
						className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full"
					>
						{cat}
					</span>
				))}
			</div>

			<div className="text-sm text-gray-600">
				{numItems} pending {numItems === 1 ? 'item' : 'items'}, largest ${largestPending}
			</div>

			<div className="w-full bg-green-200 rounded-full h-2 overflow-hidden">
				<div
					className="h-2 bg-green-600 rounded-full transition-all duration-500"
					style={{ width: `${percentPaid}%` }}
				/>
			</div>
		</div>
	)
}
