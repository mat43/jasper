'use client'

import React, { useState } from 'react'
import { X, Calculator, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'

export default function PendingSettlementsCard({
	transactions = [],    // full list from parent
	currentUser,         // session.user.username
	onSettle             // callback(ids) to update parent state
}) {
	const [calculated, setCalculated] = useState(false)
	const [settlements, setSettlements] = useState([])
	const [modalOpen, setModalOpen] = useState(false)
	const [selectedPerson, setSelectedPerson] = useState(null)
	const [paymentMethod, setPaymentMethod] = useState('manual')
	const [venmoUsername, setVenmoUsername] = useState('')
	const [expandedPerson, setExpandedPerson] = useState(null)

	// parse the JSON-string assignees field
	function getAssignees(arr) {
		try {
			return Array.isArray(arr) ? arr : JSON.parse(arr || '[]')
		} catch {
			return []
		}
	}

	// Calculate net settlements
	function calculateSettlements() {
		const netAmounts = {}

		// Calculate what I owe to each person
		transactions.forEach(tx => {
			if (tx.paid) return // Skip paid transactions
			
			const assignees = getAssignees(tx.assignees)
			
			// If I'm an assignee and not the creator, I owe this person
			if (assignees.includes(currentUser) && tx.createdBy !== currentUser) {
				if (!netAmounts[tx.createdBy]) {
					netAmounts[tx.createdBy] = { owe: 0, owed: 0, transactions: [] }
				}
				netAmounts[tx.createdBy].owe += tx.amount
				netAmounts[tx.createdBy].transactions.push({ ...tx, type: 'owe' })
			}
			
			// If I created it and someone else owes me
			if (tx.createdBy === currentUser && assignees.length > 0) {
				assignees.forEach(person => {
					if (person !== currentUser) {
						if (!netAmounts[person]) {
							netAmounts[person] = { owe: 0, owed: 0, transactions: [] }
						}
						netAmounts[person].owed += tx.amount
						netAmounts[person].transactions.push({ ...tx, type: 'owed' })
					}
				})
			}
		})

		// Calculate net amounts
		const settlementList = Object.entries(netAmounts).map(([person, data]) => {
			const net = data.owe - data.owed
			return {
				person,
				net,
				owe: data.owe,
				owed: data.owed,
				// Include ALL transactions - they all get settled when you pay/receive the net
				transactions: data.transactions
			}
		}).filter(s => s.net !== 0) // Only show if there's a net balance

		setSettlements(settlementList)
		setCalculated(true)
	}

	// Open modal and fetch Venmo username
	async function openSettleModal(settlement) {
		setSelectedPerson(settlement)
		setPaymentMethod('venmo')
		setModalOpen(true)

		// Fetch the user's Venmo handle
		try {
			const userRes = await fetch(`/api/users/${settlement.person}`)
			if (userRes.ok) {
				const userData = await userRes.json()
				setVenmoUsername(userData.venmoUsername || '')
			}
		} catch (err) {
			console.error('Could not fetch Venmo username:', err)
		}
	}

	// Handle proceed button - mark all transactions as paid
	async function handleProceed() {
		if (!selectedPerson) return

		const transactionIds = selectedPerson.transactions.map(tx => tx.id)

		// Mark all expenses paid
		try {
			await Promise.all(transactionIds.map(id =>
				fetch(`/api/expenses/${id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ paid: true })
				})
			))
			
			// Call parent callback
			transactionIds.forEach(id => onSettle(id))
		} catch (err) {
			console.error('Error marking expenses paid:', err)
			alert('Could not mark expenses as paid.')
			return
		}

		// If Venmo and net amount is positive (I owe them), open deep link
		if (paymentMethod === 'venmo' && venmoUsername && selectedPerson.net > 0) {
			const amt = Math.abs(selectedPerson.net).toFixed(2)
			const note = encodeURIComponent(`Settlement for ${selectedPerson.transactions.length} transactions`)
			const webLink = `https://venmo.com/${venmoUsername}?txn=pay&amount=${amt}&note=${note}`

			// Open Venmo website
			window.open(webLink, '_blank')
			
			// Close modal but don't reload - let user complete payment
			setModalOpen(false)
			setSelectedPerson(null)
			setCalculated(false)
			return
		}

		// Close modal and refresh (for manual payment)
		setModalOpen(false)
		setSelectedPerson(null)
		setCalculated(false)
		window.location.reload()
	}

	return (
		<>
		<div className="lg:row-span-2 group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-2xl p-6 hover:shadow-2xl hover:shadow-indigo-500/20 dark:hover:shadow-indigo-400/30 transition-all duration-300 flex flex-col min-h-72">
			<div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 dark:from-indigo-400/40 dark:to-purple-400/40 rounded-full blur-2xl"></div>
			
			<div className="relative flex items-center justify-between mb-4">
				<h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Net Settlements</h2>
				{calculated && (
					<button
						onClick={() => setCalculated(false)}
						className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors group/btn"
						title="Recalculate"
					>
						<RotateCcw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover/btn:rotate-180 transition-transform duration-500" />
					</button>
				)}
			</div>
			
			{!calculated ? (
				<div className="relative flex-1 flex flex-col items-center justify-center">
					<Calculator className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
					<p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
						Calculate net amounts owed per person
					</p>
					<button
						onClick={calculateSettlements}
						className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300"
					>
						Calculate Settlements
					</button>
				</div>
			) : (
				<div className="relative bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 space-y-3 overflow-y-auto flex-1 max-h-80">
					{settlements.length === 0 ? (
						<p className="text-center text-gray-500 dark:text-gray-400 py-8">All settled up! 🎉</p>
					) : (
						settlements.map(settlement => (
							<div key={settlement.person}>
								<div className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
									<div className="flex-1">
										<p className="text-gray-800 dark:text-white font-medium">{settlement.person}</p>
										<button
											onClick={() => setExpandedPerson(expandedPerson === settlement.person ? null : settlement.person)}
											className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mt-1"
										>
											{settlement.transactions.length} transaction{settlement.transactions.length !== 1 ? 's' : ''}
											{expandedPerson === settlement.person ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
										</button>
									</div>
									<div className="flex items-center space-x-4">
										<div className="text-right">
											<span className={`text-lg font-bold ${settlement.net > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
												{settlement.net > 0 ? '-' : '+'}${Math.abs(settlement.net).toFixed(2)}
											</span>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												{settlement.net > 0 ? 'You owe' : 'They owe you'}
											</p>
										</div>
										{settlement.net > 0 && (
											<button
												onClick={() => openSettleModal(settlement)}
												className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300"
											>
												Settle
											</button>
										)}
									</div>
								</div>
								
								{/* Expanded transaction list */}
								{expandedPerson === settlement.person && (
									<div className="mt-2 ml-4 space-y-1">
										{settlement.transactions.map(tx => (
											<div key={tx.id} className="text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-between">
												<span className="text-gray-600 dark:text-gray-400">{tx.description}</span>
												<span className={`font-medium ${tx.type === 'owe' ? 'text-red-500' : 'text-green-500'}`}>
													${tx.amount.toFixed(2)}
												</span>
											</div>
										))}
									</div>
								)}
							</div>
						))
					)}
				</div>
			)}
		</div>

		{/* Settlement Modal */}
		{modalOpen && selectedPerson && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
					<div className="relative w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/60 dark:border-gray-800/60 rounded-3xl shadow-2xl p-8 animate-slideUp">
						{/* Gradient Orb */}
						<div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-3xl opacity-30 pointer-events-none" />
						
						{/* Close Button */}
						<button
							onClick={() => setModalOpen(false)}
							className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
						>
							<X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
						</button>

						{/* Title */}
						<h2 className="relative text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
							Settle Net Balance
						</h2>

						{/* Settlement Details */}
						<div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-2xl p-5 mb-4 border border-indigo-200/50 dark:border-indigo-800/50">
							<div className="flex justify-between items-center mb-2">
								<span className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Amount</span>
								<span className="text-3xl font-bold text-red-600 dark:text-red-400">
									${Math.abs(selectedPerson.net).toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between items-center text-sm mb-2">
								<span className="text-gray-600 dark:text-gray-400">Pay to</span>
								<span className="font-semibold text-gray-900 dark:text-white">{selectedPerson.person}</span>
							</div>
							<div className="mt-2 pt-2 border-t border-indigo-200/50 dark:border-indigo-800/50 text-xs">
								<div className="flex justify-between text-gray-500 dark:text-gray-400">
									<span>You owe: ${selectedPerson.owe.toFixed(2)}</span>
									<span>They owe: ${selectedPerson.owed.toFixed(2)}</span>
								</div>
							</div>
						</div>

						{/* Transaction List */}
						<div className="relative mb-6">
							<p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
								Settling {selectedPerson.transactions.length} transaction{selectedPerson.transactions.length !== 1 ? 's' : ''}:
							</p>
							<div className="max-h-32 overflow-y-auto space-y-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
								{selectedPerson.transactions.map(tx => (
									<div key={tx.id} className="text-xs flex justify-between items-center">
										<span className="text-gray-600 dark:text-gray-400">{tx.description}</span>
										<span className="font-medium text-gray-800 dark:text-gray-200">${tx.amount.toFixed(2)}</span>
									</div>
								))}
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
								onClick={handleProceed}
								className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300"
							>
								Proceed
							</button>
							<button
								onClick={() => setModalOpen(false)}
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
