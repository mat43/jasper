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

		// Mark all expenses paid first
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

		// If Venmo, open link but DON'T reload (so prompt stays visible)
		if (paymentMethod === 'venmo' && venmoUsername && selectedPerson.net > 0) {
			const amt = Math.abs(selectedPerson.net).toFixed(2)
			const note = encodeURIComponent(`Settlement for ${selectedPerson.transactions.length} transactions`)
			const webLink = `https://venmo.com/${venmoUsername}?txn=pay&amount=${amt}&note=${note}`

			// Open Venmo website
			window.open(webLink, '_blank')
			
			// Close modal - page will stay as is, user can refresh manually
			setModalOpen(false)
			setSelectedPerson(null)
			setCalculated(false)
			return
		}

		// For manual payment, reload to show updated state
		setModalOpen(false)
		setSelectedPerson(null)
		setCalculated(false)
		window.location.reload()
	}

	return (
		<>
		<div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200 flex flex-col min-h-72">
			<div className="flex items-center justify-between mb-4">
				<p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Net Settlements</p>
				{calculated && (
					<button
						onClick={() => setCalculated(false)}
						className="p-2 hover:bg-gray-100 rounded-lg transition-colors group/btn"
						title="Recalculate"
					>
						<RotateCcw className="w-4 h-4 text-gray-500 group-hover/btn:rotate-180 transition-transform duration-500" />
					</button>
				)}
			</div>
			
			{!calculated ? (
				<div className="flex-1 flex flex-col items-center justify-center">
					<Calculator className="w-14 h-14 text-gray-200 mb-4" />
					<p className="text-sm text-gray-400 mb-4 text-center">
						Calculate net amounts owed per person
					</p>
					<button
						onClick={calculateSettlements}
						className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors duration-150"
					>
						Calculate Settlements
					</button>
				</div>
			) : (
				<div className="bg-gray-50 rounded-xl p-4 space-y-3 overflow-y-auto flex-1 max-h-80">
					{settlements.length === 0 ? (
						<p className="text-center text-gray-400 py-8">All settled up!</p>
					) : (
						settlements.map(settlement => (
							<div key={settlement.person}>
								<div className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
									<div className="flex-1">
										<p className="text-gray-800 font-medium">{settlement.person}</p>
										<button
											onClick={() => setExpandedPerson(expandedPerson === settlement.person ? null : settlement.person)}
											className="text-xs text-indigo-500 hover:underline flex items-center gap-1 mt-1"
										>
											{settlement.transactions.length} transaction{settlement.transactions.length !== 1 ? 's' : ''}
											{expandedPerson === settlement.person ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
										</button>
									</div>
									<div className="flex items-center space-x-4">
										<div className="text-right">
											<span className={`text-lg font-bold ${settlement.net > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
												{settlement.net > 0 ? '-' : '+'}${Math.abs(settlement.net).toFixed(2)}
											</span>
											<p className="text-xs text-gray-400">
												{settlement.net > 0 ? 'You owe' : 'They owe you'}
											</p>
										</div>
										{settlement.net > 0 && (
											<button
												onClick={() => openSettleModal(settlement)}
												className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors duration-150"
											>
												Settle
											</button>
										)}
									</div>
								</div>
								
								{expandedPerson === settlement.person && (
									<div className="mt-2 ml-4 space-y-1">
										{settlement.transactions.map(tx => (
											<div key={tx.id} className="text-xs p-2 bg-gray-100 rounded-lg flex justify-between">
												<span className="text-gray-500">{tx.description}</span>
												<span className={`font-medium ${tx.type === 'owe' ? 'text-red-500' : 'text-emerald-500'}`}>
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
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
					<div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
						{/* Close Button */}
						<button
							onClick={() => setModalOpen(false)}
							className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
						>
							<X className="w-5 h-5 text-gray-500" />
						</button>

						{/* Title */}
						<h2 className="text-xl font-bold text-gray-900 mb-6">
							Settle Net Balance
						</h2>

						{/* Settlement Details */}
						<div className="bg-gray-50 rounded-xl p-5 mb-4">
							<div className="flex justify-between items-center mb-2">
								<span className="text-sm text-gray-500">Net Amount</span>
								<span className="text-3xl font-bold text-red-500">
									${Math.abs(selectedPerson.net).toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between items-center text-sm mb-2">
								<span className="text-gray-500">Pay to</span>
								<span className="font-semibold text-gray-900">{selectedPerson.person}</span>
							</div>
							<div className="mt-2 pt-2 border-t border-gray-200 text-xs">
								<div className="flex justify-between text-gray-400">
									<span>You owe: ${selectedPerson.owe.toFixed(2)}</span>
									<span>They owe: ${selectedPerson.owed.toFixed(2)}</span>
								</div>
							</div>
						</div>

						{/* Transaction List */}
						<div className="mb-6">
							<p className="text-sm font-semibold text-gray-700 mb-2">
								Settling {selectedPerson.transactions.length} transaction{selectedPerson.transactions.length !== 1 ? 's' : ''}:
							</p>
							<div className="max-h-32 overflow-y-auto space-y-1 bg-gray-50 rounded-lg p-3">
								{selectedPerson.transactions.map(tx => (
									<div key={tx.id} className="text-xs flex justify-between items-center">
										<span className="text-gray-500">{tx.description}</span>
										<span className="font-medium text-gray-700">${tx.amount.toFixed(2)}</span>
									</div>
								))}
							</div>
						</div>

						{/* Payment Options */}
						<div className="space-y-3 mb-6">
							<h3 className="text-sm font-semibold text-gray-700 mb-3">Choose Payment Method</h3>

							{/* Venmo Option */}
							{venmoUsername && (
								<label className={`block cursor-pointer rounded-xl border transition-colors ${
									paymentMethod === 'venmo'
										? 'border-indigo-400 bg-indigo-50'
										: 'border-gray-200 hover:bg-gray-50'
								}`}>
									<div className="p-4">
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
												<div className="font-semibold text-gray-900 mb-1">Pay with Venmo</div>
												<div className="text-sm text-gray-500">
													Venmo: <span className="font-medium text-indigo-600">@{venmoUsername}</span>
												</div>
												<p className="text-xs text-gray-400 mt-2">
													Opens Venmo app with pre-filled payment details
												</p>
											</div>
										</div>
									</div>
								</label>
							)}

							{/* Manual Option */}
							<label className={`block cursor-pointer rounded-xl border transition-colors ${
								paymentMethod === 'manual'
									? 'border-indigo-400 bg-indigo-50'
									: 'border-gray-200 hover:bg-gray-50'
							}`}>
								<div className="p-4">
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
											<div className="font-semibold text-gray-900 mb-1">Handle payment on your own</div>
											<p className="text-sm text-gray-500">
												Pay using cash, check, bank transfer, or any other method. Click "Proceed" below when complete.
											</p>
										</div>
									</div>
								</div>
							</label>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3">
							<button
								onClick={handleProceed}
								className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors duration-150"
							>
								Proceed
							</button>
							<button
								onClick={() => setModalOpen(false)}
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
