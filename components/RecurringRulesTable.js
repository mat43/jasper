'use client'

import React from 'react'
import { format } from 'date-fns'
import { Trash2Icon } from 'lucide-react'

export default function RecurringRulesTable({
	templates = [],
	onDeleteTemplate
}) {
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

	// Wrapper that confirms before calling onDeleteTemplate
	function handleDelete(id) {
		if (!confirm('Remove this recurring rule?')) return
		onDeleteTemplate?.(id)
	}

	return (
		<div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
			<h2 className="text-lg font-medium text-gray-900 mb-4">Recurring Rules</h2>
			<table className="w-full text-left table-auto">
				<thead>
					<tr className="border-b">
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
							<th key={h} className="py-2 px-3 text-sm text-gray-600">
								{h}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{list.length === 0 ? (
						<tr>
							<td colSpan={9} className="py-4 px-3 text-center text-gray-500 italic">
								No recurring rules set up.
							</td>
						</tr>
					) : (
						list.map(t => {
							const assignees = parseAssignees(t.assignees)
							return (
								<tr key={t.id} className="hover:bg-gray-50">
									<td className="py-2 px-3 text-gray-800 text-sm">
										{t.description}
									</td>
									<td className="py-2 px-3 text-gray-800 text-sm">
										${t.amount.toFixed(2)}
									</td>
									<td className="py-2 px-3 text-gray-800 text-sm">
										{t.category}
									</td>
									<td className="py-2 px-3 text-gray-800 text-sm capitalize">
										{t.frequency}
									</td>
									<td className="py-2 px-3 text-gray-800 text-sm">
										{t.frequency === 'monthly'
											? `Day ${t.dayOfMonth}`
											: `Every ${t.dayOfWeek}`}
									</td>
									<td className="py-2 px-3 text-gray-800 text-sm">
										{assignees.join(', ') || 'None'}
									</td>
									<td className="py-2 px-3 text-gray-800 text-sm">
										{t.createdBy}
									</td>
									<td className="py-2 px-3 text-gray-800 text-sm">
										{format(new Date(t.createdAt), 'MM/dd/yyyy')}
									</td>
									<td className="py-2 px-3 text-center">
										<button
											onClick={() => handleDelete(t.id)}
											className="p-2 hover:bg-red-100 rounded-full"
											title="Remove Recurrence"
										>
											<Trash2Icon className="w-4 h-4 text-red-600 mx-auto" />
										</button>
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
