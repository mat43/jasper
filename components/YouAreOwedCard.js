// components/YouAreOwedCard.jsx
'use client'

import React from 'react'

export default function YouAreOwedCard({ transactions, currentUser, onMarkPaid }) {
	// helper to turn the JSON-string assignees into an array
	function getAssignees(arr) {
		try {
			return Array.isArray(arr) ? arr : JSON.parse(arr || '[]')
		} catch {
			return []
		}
	}

	// all receivables you created
	const yourReceivables = transactions.filter(t => t.createdBy === currentUser)
	console.log(currentUser);
	const pending = yourReceivables.filter(t => !t.paid)

	const totalAll = yourReceivables.reduce((sum, t) => sum + t.amount, 0)
	const totalOwed = pending.reduce((sum, t) => sum + t.amount, 0)
	const totalPaid = totalAll - totalOwed
	const percentPaid = totalAll > 0 ? (totalPaid / totalAll) * 100 : 0

	async function handleMarkPaid(id) {
		if (!confirm('Mark this as paid?')) return
		try {
			const res = await fetch(`/api/expenses/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ paid: true })
			})
			if (!res.ok) throw new Error('Mark paid failed')
			onMarkPaid(id)
		} catch (err) {
			console.error(err)
			alert('Error marking paid')
		}
	}

	return (
		<div className="bg-white rounded-2xl shadow p-6 flex flex-col">
			<h2 className="text-lg font-medium text-gray-900">You Are Owed</h2>

			<p className="text-3xl font-bold text-gray-900">
				${totalOwed.toFixed(2)}
			</p>
			<p className="text-sm text-gray-600">
				{pending.length} pending{' '}
				{pending.length === 1 ? 'item' : 'items'}
			</p>

			{/* progress bar now shows % paid */}
			<div className="w-full bg-gray-200 rounded-full h-2 mt-2">
				<div
					className="h-2 bg-blue-600 rounded-full"
					style={{ width: `${percentPaid}%` }}
				/>
			</div>

			{/* detail list */}
			<div className="mt-4 overflow-y-auto max-h-48 divide-y divide-gray-200">
				{pending.map(r => {
					const assignees = getAssignees(r.assignees)
					return (
						<div
							key={r.id}
							className="py-3 flex justify-between items-center"
						>
							<div>
								<p className="font-medium text-gray-800">{r.description}</p>
								<p className="text-xs text-gray-500">
									Owed by {assignees.join(', ') || '—'}
								</p>
							</div>
							<div className="flex items-center space-x-6">
								<span className="font-semibold text-gray-800">
									${r.amount.toFixed(2)}
								</span>
								<button
									onClick={() => handleMarkPaid(r.id)}
									className="
                    px-4 py-1 
                    bg-gradient-to-r from-purple-600 to-blue-400 
                    text-white text-sm 
                    rounded-full 
                    hover:opacity-90 
                    transition
                  "
								>
									Mark Paid
								</button>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
