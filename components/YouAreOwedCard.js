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
			<div className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-2xl p-6 hover:shadow-2xl hover:shadow-amber-500/20 dark:hover:shadow-amber-400/30 transition-all duration-300 flex flex-col">
			<div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-500/30 to-orange-500/30 dark:from-amber-400/40 dark:to-orange-400/40 rounded-full blur-2xl"></div>
			
			<h2 className="relative text-sm font-semibold text-gray-600 dark:text-gray-400">You Are Owed</h2>

			<p className="relative text-3xl font-bold text-gray-900 dark:text-white">
				${totalOwed.toFixed(2)}
			</p>
			<p className="relative text-sm text-gray-600 dark:text-gray-400">
				{pending.length} pending{' '}
				{pending.length === 1 ? 'item' : 'items'}
			</p>

			{/* progress bar now shows % paid */}
			<div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
				<div
					className="h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
					style={{ width: `${percentPaid}%` }}
				/>
			</div>

			{/* detail list */}
			<div className="relative mt-4 overflow-y-auto max-h-48 divide-y divide-gray-200 dark:divide-gray-700">
				{pending.map(r => {
					const assignees = getAssignees(r.assignees)
					return (
						<div
							key={r.id}
							className="py-3 flex justify-between items-center"
						>
							<div>
								<p className="font-medium text-gray-800 dark:text-white">{r.description}</p>
								<p className="text-xs text-gray-500 dark:text-gray-400">
									Owed by {assignees.join(', ') || '—'}
								</p>
							</div>
							<div className="flex items-center space-x-6">
								<span className="font-semibold text-gray-800 dark:text-white">
									${r.amount.toFixed(2)}
								</span>
								<button
									onClick={() => setMarkPaidModal(r)}
									className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300"
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
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
				<div className="relative w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-emerald-200/60 dark:border-emerald-800/60 rounded-3xl shadow-2xl p-8 animate-slideUp">
					{/* Success Gradient Orb */}
					<div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full blur-3xl opacity-30 pointer-events-none" />
					
					{/* Close Button */}
					<button
						onClick={() => setMarkPaidModal(null)}
						className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
					>
						<X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
					</button>

					{/* Title */}
					<h2 className="relative text-2xl font-bold text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6">
						Mark as Paid
					</h2>

					{/* Expense Details */}
					<div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-2xl p-5 mb-6 border border-emerald-200/50 dark:border-emerald-800/50">
						<p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-2">
							{markPaidModal.description}
						</p>
						<p className="text-center text-3xl font-bold text-gray-900 dark:text-white mb-2">
							${markPaidModal.amount.toFixed(2)}
						</p>
						<p className="text-center text-xs text-gray-500 dark:text-gray-400">
							Owed by: {getAssignees(markPaidModal.assignees).join(', ')}
						</p>
					</div>

					<p className="relative text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
						Confirm that this payment has been received?
					</p>

					{/* Action Buttons */}
					<div className="relative flex gap-3">
						<button
							onClick={() => handleMarkPaid(markPaidModal.id)}
							className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300"
						>
							Mark as Paid
						</button>
						<button
							onClick={() => setMarkPaidModal(null)}
							className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-300"
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
