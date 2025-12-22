'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Trash2Icon, ChevronLeft, ChevronRight, X, AlertTriangle } from 'lucide-react'

export default function TransactionsTable({
	transactions = [],
	onDelete,
	currentUser = '', // e.g., session.user.username or .name
}) {
	const ITEMS_PER_PAGE = 15
	const [currentPage, setCurrentPage] = useState(1)
	const [deleteModal, setDeleteModal] = useState(null)
	const [forceDeleteModal, setForceDeleteModal] = useState(null)
	const [settleModal, setSettleModal] = useState(null)
	const [markPaidModal, setMarkPaidModal] = useState(null)
	const [markUnpaidModal, setMarkUnpaidModal] = useState(null)
	const [paymentMethod, setPaymentMethod] = useState('manual')
	const [venmoUsername, setVenmoUsername] = useState('')

	// Debug log
	useEffect(() => {
		console.log('TransactionsTable currentUser:', currentUser)
		console.log('Sample transaction:', transactions[0])
	}, [currentUser, transactions])

	// Reset to page 1 if transactions change
	useEffect(() => {
		setCurrentPage(1)
	}, [transactions])

	// Treat t.assignees as an array (fallback to empty)
	function getAssignees(arr) {
		return Array.isArray(arr) ? arr : []
	}

	// Pagination calculations
	const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE)
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
	const endIndex = startIndex + ITEMS_PER_PAGE
	const paginatedTransactions = transactions.slice(startIndex, endIndex)
	const showPagination = transactions.length > ITEMS_PER_PAGE

	// DELETE a transaction
	async function handleDelete() {
		if (!deleteModal) return
		try {
			const res = await fetch(`/api/expenses/${deleteModal.id}`, { method: 'DELETE' })
			if (!res.ok) throw new Error('Delete failed')
			onDelete?.(deleteModal.id)
			setDeleteModal(null)
		} catch (err) {
			console.error(err)
			alert('Error deleting transaction')
		}
	}

	// Force delete (for Mathew)
	async function handleForceDelete() {
		if (!forceDeleteModal) return
		try {
			const res = await fetch(`/api/expenses/${forceDeleteModal.id}`, { method: 'DELETE' })
			if (!res.ok) throw new Error('Delete failed')
			onDelete?.(forceDeleteModal.id)
			setForceDeleteModal(null)
		} catch (err) {
			console.error(err)
			alert('Error deleting transaction')
		}
	}

	// Mark expense as paid/unpaid
	async function togglePaidStatus(id, currentStatus) {
		try {
			const res = await fetch(`/api/expenses/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ paid: !currentStatus })
			})
			if (!res.ok) throw new Error('Update failed')
			// Close modals and refresh
			setMarkPaidModal(null)
			setMarkUnpaidModal(null)
			window.location.reload()
		} catch (err) {
			console.error(err)
			alert('Error updating expense status')
		}
	}

	// Open settle modal for assignees
	async function openSettleModal(tx) {
		setSettleModal(tx)
		setPaymentMethod('venmo')

		// Fetch Venmo username
		try {
			const userRes = await fetch(`/api/users/${tx.createdBy}`)
			if (userRes.ok) {
				const userData = await userRes.json()
				setVenmoUsername(userData.venmoUsername || '')
			}
		} catch (err) {
			console.error('Could not fetch Venmo username:', err)
		}
	}

	// Handle settle proceed
	async function handleSettleProceed() {
		if (!settleModal) return

		const { id, amount, description } = settleModal

		// Mark expense paid first
		try {
			const patch = await fetch(`/api/expenses/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ paid: true })
			})
			if (!patch.ok) throw new Error('Mark-paid failed')
		} catch (err) {
			console.error('Error marking expense paid:', err)
			alert('Could not mark this expense as paid.')
			return
		}

		// If Venmo, open link but DON'T reload (so prompt stays visible)
		if (paymentMethod === 'venmo' && venmoUsername) {
			const amt = amount.toFixed(2)
			const note = encodeURIComponent(description)
			const webLink = `https://venmo.com/${venmoUsername}?txn=pay&amount=${amt}&note=${note}`

			// Open Venmo website
			window.open(webLink, '_blank')
			
			// Close modal - page will stay as is, user can refresh manually
			setSettleModal(null)
			return
		}

		// For manual payment, reload to show updated state
		setSettleModal(null)
		window.location.reload()
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
		<>
			<div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/60 dark:border-gray-800/60 rounded-2xl shadow-lg p-6 overflow-x-auto">
			{/* Gradient Orb */}
			<div className="absolute top-4 right-4 w-40 h-40 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full blur-2xl opacity-20 pointer-events-none" />
			
			<div className="flex justify-between items-center mb-4 relative z-10">
				<h2 className="text-lg font-medium text-gray-900 dark:text-white">All Transactions</h2>
				<button 
					onClick={exportCSV} 
					className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 rounded-lg shadow-md hover:shadow-lg transition-all"
				>
					Export CSV
				</button>
			</div>

			<table className="w-full text-left table-auto relative z-10">
				<thead>
					<tr className="border-b border-gray-200 dark:border-gray-700">
						{[
							'Date', 'Description', 'Category', 'Amount',
							'Assigned To', 'Created By', 'Paid', 'Actions'
						].map(header => (
							<th key={header} className="py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
								{header}
							</th>
						))}
					</tr>
				</thead>

				<tbody>
					{paginatedTransactions.length === 0 ? (
						<tr>
							<td colSpan={9} className="py-4 px-3 text-center text-gray-500 dark:text-gray-400 italic">
								No transactions found.
							</td>
						</tr>
					) : (
						paginatedTransactions.map(t => {
							const assignees = getAssignees(t.assignees)
							const isCreator = t.createdBy === currentUser
							const isAssignee = assignees.includes(currentUser)
							const isMathew = currentUser === 'Mathew' || currentUser === 'mathew'
							
							// Debug: log for first transaction
							if (t.id === paginatedTransactions[0].id) {
								console.log('Debug Transaction Actions:', {
									currentUser,
									createdBy: t.createdBy,
									assignees,
									isCreator,
									isAssignee,
									isMathew
								})
							}
							
							return (
								<tr key={t.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 last:border-0 ${t.paid ? 'bg-green-50/30 dark:bg-green-950/10' : ''}`}>
									<td className="py-3 px-3 text-gray-800 dark:text-gray-200 text-sm">
										{format(new Date(t.createdAt), 'MM/dd/yyyy')}
									</td>
									<td className="py-3 px-3 text-gray-800 dark:text-gray-200 text-sm">{t.description}</td>
									<td className="py-3 px-3 text-gray-800 dark:text-gray-200 text-sm">{t.category}</td>
									<td className="py-3 px-3 text-gray-800 dark:text-gray-200 text-sm font-medium">
										${t.amount.toFixed(2)}
									</td>
									<td className="py-3 px-3 text-gray-800 dark:text-gray-200 text-sm">
										{assignees.join(', ') || 'None'}
									</td>
									<td className="py-3 px-3 text-gray-800 dark:text-gray-200 text-sm">{t.createdBy}</td>
									<td className="py-3 px-3 text-center text-sm">
										<span className={t.paid ? 'text-green-500 dark:text-green-400 font-semibold' : 'text-red-500 dark:text-red-400'}>
											{t.paid ? '✓' : '✗'}
										</span>
									</td>
									<td className="py-3 px-3">
										<div className="flex justify-center gap-2">
											{/* Debug: Always show at least one button if currentUser exists */}
											{!currentUser && (
												<span className="text-xs text-gray-400">No user</span>
											)}
											
											{/* Assignee actions (if you owe this expense) */}
											{currentUser && isAssignee && !isCreator && (
												<>
													{!t.paid ? (
														<button
															onClick={() => openSettleModal(t)}
															className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all"
															title="Settle payment"
														>
															Settle
														</button>
													) : (
														<button
															onClick={() => togglePaidStatus(t.id, t.paid)}
															className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all"
															title="Mark as unpaid"
														>
															Mark Unpaid
														</button>
													)}
												</>
											)}

											{/* Creator actions (if you created this expense) */}
											{currentUser && isCreator && (
												<>
													{t.paid ? (
														<button
															onClick={() => setMarkUnpaidModal(t)}
															className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all"
															title="Mark as unpaid"
														>
															Mark Unpaid
														</button>
													) : (
														<button
															onClick={() => setMarkPaidModal(t)}
															className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg shadow-md hover:shadow-lg transition-all"
															title="Mark as paid"
														>
															Mark Paid
														</button>
													)}
													<button
														onClick={() => setDeleteModal(t)}
														className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
														title="Delete"
													>
														<Trash2Icon className="w-4 h-4 text-red-600 dark:text-red-400" />
													</button>
												</>
											)}

											{/* Mathew's force delete (if not creator) */}
											{currentUser && isMathew && !isCreator && (
												<button
													onClick={() => setForceDeleteModal(t)}
													className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-lg shadow-md hover:shadow-lg transition-all"
													title="Force delete (organizer only)"
												>
													Force Delete
												</button>
											)}
										</div>
									</td>
								</tr>
							)
						})
					)}
				</tbody>
			</table>

			{/* Pagination */}
			{showPagination && (
				<div className="flex items-center justify-between mt-4 relative z-10">
					<div className="text-sm text-gray-600 dark:text-gray-400">
						Showing {startIndex + 1} to {Math.min(endIndex, transactions.length)} of {transactions.length} transactions
					</div>
					
					<div className="flex items-center gap-2">
						<button
							onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
							disabled={currentPage === 1}
							className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							title="Previous page"
						>
							<ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
						</button>
						
						<div className="flex gap-1">
							{Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
								<button
									key={page}
									onClick={() => setCurrentPage(page)}
									className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
										page === currentPage
											? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md'
											: 'bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
									}`}
								>
									{page}
								</button>
							))}
						</div>
						
						<button
							onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages}
							className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							title="Next page"
						>
							<ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
						</button>
					</div>
				</div>
			)}
		</div>

		{/* Modals - Rendered outside main container */}
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
						Delete Transaction?
					</h2>
					
					<p className="relative text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
						This action cannot be undone.
					</p>

					{/* Transaction Details */}
					<div className="relative bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 rounded-2xl p-5 mb-6 border border-red-200/50 dark:border-red-800/50">
						<p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-2">
							{deleteModal.description}
						</p>
						<p className="text-center text-3xl font-bold text-gray-900 dark:text-white mb-2">
							${deleteModal.amount.toFixed(2)}
						</p>
						<p className="text-center text-xs text-gray-500 dark:text-gray-400">
							Category: {deleteModal.category}
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
							Delete
						</button>
					</div>
				</div>
			</div>
		)}
		
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
								Assignees: {getAssignees(markPaidModal.assignees).join(', ')}
							</p>
						</div>

						<p className="relative text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
							Confirm that this expense has been paid?
						</p>

						{/* Action Buttons */}
						<div className="relative flex gap-3">
							<button
								onClick={() => togglePaidStatus(markPaidModal.id, markPaidModal.paid)}
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

			{/* Mark Unpaid Confirmation Modal */}
			{markUnpaidModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
					<div className="relative w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-amber-200/60 dark:border-amber-800/60 rounded-3xl shadow-2xl p-8 animate-slideUp">
						{/* Warning Gradient Orb */}
						<div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full blur-3xl opacity-30 pointer-events-none" />
						
						{/* Close Button */}
						<button
							onClick={() => setMarkUnpaidModal(null)}
							className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
						>
							<X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
						</button>

						{/* Title */}
						<h2 className="relative text-2xl font-bold text-center bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-6">
							Mark as Unpaid
						</h2>

						{/* Expense Details */}
						<div className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 rounded-2xl p-5 mb-6 border border-amber-200/50 dark:border-amber-800/50">
							<p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-2">
								{markUnpaidModal.description}
							</p>
							<p className="text-center text-3xl font-bold text-gray-900 dark:text-white mb-2">
								${markUnpaidModal.amount.toFixed(2)}
							</p>
							<p className="text-center text-xs text-gray-500 dark:text-gray-400">
								Assignees: {getAssignees(markUnpaidModal.assignees).join(', ')}
							</p>
						</div>

						<p className="relative text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
							This will mark the expense as unpaid. Continue?
						</p>

						{/* Action Buttons */}
						<div className="relative flex gap-3">
							<button
								onClick={() => togglePaidStatus(markUnpaidModal.id, markUnpaidModal.paid)}
								className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300"
							>
								Mark as Unpaid
							</button>
							<button
								onClick={() => setMarkUnpaidModal(null)}
								className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-300"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Force Delete Confirmation Modal */}
			{forceDeleteModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
					<div className="relative w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-red-200/60 dark:border-red-800/60 rounded-3xl shadow-2xl p-8 animate-slideUp">
						{/* Warning Gradient Orb */}
						<div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-red-500 to-orange-500 rounded-full blur-3xl opacity-30 pointer-events-none" />
						
						{/* Close Button */}
						<button
							onClick={() => setForceDeleteModal(null)}
							className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
						>
							<X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
						</button>

						{/* Warning Icon */}
						<div className="relative flex justify-center mb-4">
							<div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
								<AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
							</div>
						</div>

						{/* Title */}
						<h2 className="relative text-2xl font-bold text-center bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">
							Force Delete Warning
						</h2>

						{/* Warning Message */}
						<div className="relative bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 rounded-2xl p-5 mb-6 border border-red-200/50 dark:border-red-800/50">
							<p className="text-center text-gray-800 dark:text-gray-200 mb-3">
								This expense was created by <span className="font-bold text-red-600 dark:text-red-400">{forceDeleteModal.createdBy}</span>.
							</p>
							<p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-2">
								<span className="font-semibold">{forceDeleteModal.description}</span>
							</p>
							<p className="text-center text-2xl font-bold text-gray-900 dark:text-white">
								${forceDeleteModal.amount.toFixed(2)}
							</p>
						</div>

						<p className="relative text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
							Are you sure you want to delete this expense as the organizer?
						</p>

						{/* Action Buttons */}
						<div className="relative flex gap-3">
							<button
								onClick={handleForceDelete}
								className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300"
							>
								Force Delete
							</button>
							<button
								onClick={() => setForceDeleteModal(null)}
								className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-300"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Settle Payment Modal */}
			{settleModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
					<div className="relative w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/60 dark:border-gray-800/60 rounded-3xl shadow-2xl p-8 animate-slideUp">
						{/* Gradient Orb */}
						<div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-3xl opacity-30 pointer-events-none" />
						
						{/* Close Button */}
						<button
							onClick={() => setSettleModal(null)}
							className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
						>
							<X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
						</button>

						{/* Title */}
						<h2 className="relative text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
							Settle Payment
						</h2>

						{/* Settlement Details */}
						<div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-2xl p-5 mb-6 border border-indigo-200/50 dark:border-indigo-800/50">
							<div className="flex justify-between items-center mb-2">
								<span className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount Due</span>
								<span className="text-3xl font-bold text-gray-900 dark:text-white">
									${settleModal.amount.toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between items-center text-sm">
								<span className="text-gray-600 dark:text-gray-400">Pay to</span>
								<span className="font-semibold text-gray-900 dark:text-white">{settleModal.createdBy}</span>
							</div>
							<div className="mt-2 pt-2 border-t border-indigo-200/50 dark:border-indigo-800/50">
								<span className="text-xs text-gray-500 dark:text-gray-400">{settleModal.description}</span>
							</div>
						</div>

						{/* Payment Options */}
						<div className="relative space-y-3 mb-6">
							<h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Choose Payment Method</h3>

							{/* Venmo Option */}
							{venmoUsername && (
								<label className={`block cursor-pointer transition-all ${
									paymentMethod === 'venmo' 
										? 'ring-2 ring-indigo-500 dark:ring-indigo-400' 
										: 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
								}`}>
									<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
										<div className="flex items-start gap-3">
											<input
												type="radio"
												name="payment_method"
												value="venmo"
												checked={paymentMethod === 'venmo'}
												onChange={(e) => setPaymentMethod(e.target.value)}
												className="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
											/>
											<div className="flex-1">
												<div className="font-semibold text-gray-900 dark:text-white mb-1">
													Pay with Venmo
												</div>
												<div className="text-sm text-gray-600 dark:text-gray-400">
													Venmo: <span className="font-medium text-indigo-600 dark:text-indigo-400">@{venmoUsername}</span>
												</div>
												<p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
													Opens Venmo app with pre-filled payment details
												</p>
											</div>
										</div>
									</div>
								</label>
							)}

							{/* Manual Option */}
							<label className={`block cursor-pointer transition-all ${
								paymentMethod === 'manual' 
									? 'ring-2 ring-indigo-500 dark:ring-indigo-400' 
									: 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
							}`}>
								<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
									<div className="flex items-start gap-3">
										<input
											type="radio"
											name="payment_method"
											value="manual"
											checked={paymentMethod === 'manual'}
											onChange={(e) => setPaymentMethod(e.target.value)}
											className="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
										/>
										<div className="flex-1">
											<div className="font-semibold text-gray-900 dark:text-white mb-1">
												Handle payment on your own
											</div>
											<p className="text-sm text-gray-600 dark:text-gray-400">
												Pay using cash, check, bank transfer, or any other method. Click "Proceed" below when complete.
											</p>
										</div>
									</div>
								</div>
							</label>
						</div>

						{/* Action Buttons */}
						<div className="relative flex gap-3">
							<button
								onClick={handleSettleProceed}
								className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300"
							>
								Proceed
							</button>
							<button
								onClick={() => setSettleModal(null)}
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
