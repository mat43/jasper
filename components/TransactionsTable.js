'use client'

import React from 'react'
import { format } from 'date-fns'
import { Trash2Icon } from 'lucide-react'

export default function TransactionsTable({
	transactions = [],
	onDelete,
}) {
	// Treat t.assignees as an array (fallback to empty)
	function getAssignees(arr) {
		return Array.isArray(arr) ? arr : []
	}

	// DELETE a transaction
	async function deleteTransaction(id) {
		if (!confirm('Delete this transaction?')) return
		try {
			const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
			if (!res.ok) throw new Error('Delete failed')
			onDelete?.(id)
		} catch (err) {
			console.error(err)
			alert('Error deleting transaction')
		}
	}

	// Build and download CSV
	function exportCSV() {
		if (!transactions.length) return
		const headers = [
			'Date', 'Description', 'Category', 'Amount',
			'Assigned To', 'Created By', 'Paid'
		]
		const rows = transactions.map(t => {
			const as = getAssignees(t.assignees)
			return [
				format(new Date(t.createdAt), 'MM/dd/yyyy'),
				t.description,
				t.category,
				t.amount.toFixed(2),
				as.join(', ') || 'None',
				t.createdBy,
				t.paid ? 'Yes' : 'No',
			]
		})

		const csv = [headers, ...rows]
			.map(r => r.map(c => `"${c}"`).join(','))
			.join('\n')

		const blob = new Blob([csv], { type: 'text/csv' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'transactions.csv'
		a.click()
		URL.revokeObjectURL(url)
	}

	return (
		<div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-lg font-medium text-gray-900">All Transactions</h2>
				<button onClick={exportCSV} className="text-sm text-indigo-600 hover:underline">
					Export CSV
				</button>
			</div>

			<table className="w-full text-left table-auto">
				<thead>
					<tr className="border-b">
						{[
							'Date', 'Description', 'Category', 'Amount',
							'Assigned To', 'Created By', 'Paid', 'Actions'
						].map(header => (
							<th key={header} className="py-2 px-3 text-sm text-gray-600">
								{header}
							</th>
						))}
					</tr>
				</thead>

				<tbody>
					{transactions.length === 0 ? (
						<tr>
							<td colSpan={9} className="py-4 px-3 text-center text-gray-500 italic">
								No transactions found.
							</td>
						</tr>
					) : (
						transactions.map(t => {
							const assignees = getAssignees(t.assignees)
							return (
								<tr key={t.id} className="hover:bg-gray-50">
									<td className="py-2 px-3 text-gray-800 text-sm">
										{format(new Date(t.createdAt), 'MM/dd/yyyy')}
									</td>
									<td className="py-2 px-3 text-gray-800 text-sm">{t.description}</td>
									<td className="py-2 px-3 text-gray-800 text-sm">{t.category}</td>
									<td className="py-2 px-3 text-gray-800 text-sm">
										${t.amount.toFixed(2)}
									</td>
									<td className="py-2 px-3 text-gray-800 text-sm">
										{assignees.join(', ') || 'None'}
									</td>
									<td className="py-2 px-3 text-gray-800 text-sm">{t.createdBy}</td>
									<td className="py-2 px-3 text-center text-sm font-semibold">
										{t.paid ? '✓' : '✗'}
									</td>
									<td className="py-2 px-3">
										<div className="flex justify-center space-x-2">
											<button
												onClick={() => deleteTransaction(t.id)}
												className="p-2 hover:bg-red-100 rounded-full"
												title="Delete"
											>
												<Trash2Icon className="w-4 h-4 text-red-600" />
											</button>
										</div>
									</td>
								</tr>
							)
						})
					)}
				</tbody>
			</table>
		</div>
	)
}
