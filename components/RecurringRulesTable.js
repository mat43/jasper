'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { Trash2Icon, X, AlertTriangle } from 'lucide-react'

export default function RecurringRulesTable({
	templates = [],
	onDeleteTemplate
}) {
	const [deleteModal, setDeleteModal] = useState(null)
	// Ensure templates is always an array
	const list = Array.isArray(templates) ? templates : []

	// Helper to parse the JSON‑string `assignees` field
	function parseAssignees(raw) {
		if (!raw) return []
		if (Array.isArray(raw)) return raw
		try {
			const parsed = JSON.parse(raw)
			return Array.isArray(parsed) ? parsed : []
		} catch {
			return []
		}
	}

	// Handle delete with modal
	async function handleDelete() {
		if (!deleteModal) return
		onDeleteTemplate?.(deleteModal.id)
		setDeleteModal(null)
	}

	return (
		<>
		<div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/60 dark:border-gray-800/60 rounded-2xl shadow-lg p-6 overflow-x-auto">
			{/* Gradient Orb */}
			<div className="absolute top-4 right-4 w-40 h-40 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-2xl opacity-20 pointer-events-none" />
			<h2 className="relative z-10 text-lg font-medium text-gray-900 dark:text-white mb-4">Recurring Rules</h2>
			<table className="w-full text-left table-auto relative z-10">
				<thead>
					<tr className="border-b border-gray-200 dark:border-gray-700">
						{[
							'Description',
							'Amount',
							'Category',
							'Freq',
							'Schedule',
							'Assigned To',
							'Created By',
							'Created',
							'Actions'
						].map(h => (
							<th key={h} className="py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
								{h}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{list.length === 0 ? (
						<tr>
							<td colSpan={9} className="py-4 px-3 text-center text-gray-500 dark:text-gray-400 italic">
								No recurring rules set up.
							</td>
						</tr>
					) : (
						list.map(t => {
							const assignees = parseAssignees(t.assignees)
							return (
								<tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 last:border-0">
									<td className="py-2 px-3 text-gray-800 dark:text-gray-200 text-sm">
										{t.description}
									</td>
									<td className="py-2 px-3 text-gray-800 dark:text-gray-200 text-sm font-medium">
										${t.amount.toFixed(2)}
									</td>
									<td className="py-2 px-3 text-gray-800 dark:text-gray-200 text-sm">
										{t.category}
									</td>
									<td className="py-2 px-3 text-gray-800 dark:text-gray-200 text-sm capitalize">
										{t.frequency}
									</td>
									<td className="py-2 px-3 text-gray-800 dark:text-gray-200 text-sm">
										{t.frequency === 'monthly'
											? `Day ${t.dayOfMonth}`
											: `Every ${t.dayOfWeek}`}
									</td>
									<td className="py-2 px-3 text-gray-800 dark:text-gray-200 text-sm">
										{assignees.join(', ') || 'None'}
									</td>
									<td className="py-2 px-3 text-gray-800 dark:text-gray-200 text-sm">
										{t.createdBy}
									</td>
									<td className="py-2 px-3 text-gray-800 dark:text-gray-200 text-sm">
										{format(new Date(t.createdAt), 'MM/dd/yyyy')}
									</td>
									<td className="py-2 px-3 text-center">
										<button
											onClick={() => setDeleteModal(t)}
											className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
											title="Remove Recurrence"
										>
											<Trash2Icon className="w-4 h-4 text-red-600 dark:text-red-400 mx-auto" />
										</button>
									</td>
								</tr>
							)
						})
					)}
				</tbody>
			</table>
		</div>

		{/* Delete Confirmation Modal */}
		{deleteModal && (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
				<div className="relative w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-red-200/60 dark:border-red-800/60 rounded-3xl shadow-2xl p-8 animate-slideUp">
					{/* Warning Gradient Orb */}
					<div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-red-500 to-orange-500 rounded-full blur-3xl opacity-30 pointer-events-none" />
					
					{/* Close Button */}
					<button
						onClick={() => setDeleteModal(null)}
						className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
					>
						<X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
					</button>

					{/* Warning Icon */}
					<div className="relative flex justify-center mb-6">
						<div className="p-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl">
							<AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
						</div>
					</div>

					{/* Title */}
					<h2 className="relative text-2xl font-bold text-center bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
						Remove Recurring Rule?
					</h2>
					
					<p className="relative text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
						This will stop future automatic expenses from being created.
					</p>

					{/* Rule Details */}
					<div className="relative bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 rounded-2xl p-5 mb-6 border border-red-200/50 dark:border-red-800/50">
						<p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-2">
							{deleteModal.description}
						</p>
						<p className="text-center text-3xl font-bold text-gray-900 dark:text-white mb-2">
							${deleteModal.amount.toFixed(2)}
						</p>
						<p className="text-center text-xs text-gray-500 dark:text-gray-400">
							{deleteModal.frequency === 'monthly' ? `Monthly on day ${deleteModal.dayOfMonth}` : `Weekly on ${deleteModal.dayOfWeek}`}
						</p>
					</div>

					{/* Action Buttons */}
					<div className="relative flex gap-3">
						<button
							onClick={() => setDeleteModal(null)}
							className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl transition-all"
						>
							Cancel
						</button>
						<button
							onClick={handleDelete}
							className="flex-1 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl shadow-lg hover:shadow-xl transition-all"
						>
							Remove Rule
						</button>
					</div>
				</div>
			</div>
		)}
		</>
	)
}
