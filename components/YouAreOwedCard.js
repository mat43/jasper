// components/YouAreOwedCard.jsx
'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'

export default function YouAreOwedCard({ transactions, currentUser, onMarkPaid }) {
	const [markPaidModal, setMarkPaidModal] = useState(null)

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
		try {
			const res = await fetch(`/api/expenses/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ paid: true })
			})
			if (!res.ok) throw new Error('Mark paid failed')
			onMarkPaid(id)
			setMarkPaidModal(null)
		} catch (err) {
			console.error(err)
			alert('Error marking paid')
		}
	}

	return (
		<>
			<div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200 flex flex-col">
			<p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">You Are Owed</p>

			<p className="text-3xl font-bold text-gray-900">
				${totalOwed.toFixed(2)}
			</p>
			<p className="text-sm text-gray-500 mb-2">
				{pending.length} pending {pending.length === 1 ? 'item' : 'items'}
			</p>

			<div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 mb-4">
				<div
					className="h-1.5 bg-amber-500 rounded-full"
					style={{ width: `${percentPaid}%` }}
				/>
			</div>

			{/* detail list */}
			<div className="overflow-y-auto max-h-48 divide-y divide-gray-100">
				{pending.map(r => {
					const assignees = getAssignees(r.assignees)
					return (
						<div
							key={r.id}
							className="py-3 flex justify-between items-center"
						>
							<div>
								<p className="font-medium text-gray-800">{r.description}</p>
								<p className="text-xs text-gray-400">
									Owed by {assignees.join(', ') || '—'}
								</p>
							</div>
							<div className="flex items-center space-x-4">
								<span className="font-semibold text-gray-800">
									${r.amount.toFixed(2)}
								</span>
								<button
									onClick={() => setMarkPaidModal(r)}
									className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors duration-150"
								>
									Mark Paid
								</button>
							</div>
						</div>
					)
				})}
			</div>
		</div>

		{/* Mark Paid Confirmation Modal */}
		{markPaidModal && (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
				<div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
					<button
						onClick={() => setMarkPaidModal(null)}
						className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
					>
						<X className="w-5 h-5 text-gray-500" />
					</button>

					<h2 className="text-xl font-bold text-gray-900 mb-6">Mark as Paid</h2>

					<div className="bg-gray-50 rounded-xl p-5 mb-6">
						<p className="text-center text-sm text-gray-500 mb-2">{markPaidModal.description}</p>
						<p className="text-center text-3xl font-bold text-gray-900 mb-2">${markPaidModal.amount.toFixed(2)}</p>
						<p className="text-center text-xs text-gray-400">
							Owed by: {getAssignees(markPaidModal.assignees).join(', ')}
						</p>
					</div>

					<p className="text-center text-sm text-gray-500 mb-6">
						Confirm that this payment has been received?
					</p>

					<div className="flex gap-3">
						<button
							onClick={() => handleMarkPaid(markPaidModal.id)}
							className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors duration-150"
						>
							Mark as Paid
						</button>
						<button
							onClick={() => setMarkPaidModal(null)}
							className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors duration-150"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		)}
	</>
	)
}
