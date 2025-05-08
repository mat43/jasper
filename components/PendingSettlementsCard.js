'use client'

import React from 'react'

export default function PendingSettlementsCard({
	transactions = [],    // full list from parent
	currentUser,         // session.user.name or .email
	onSettle             // callback(id) to update parent state
}) {
	// parse the JSON-string assignees field
	function getAssignees(arr) {
		try {
			return Array.isArray(arr) ? arr : JSON.parse(arr || '[]')
		} catch {
			return []
		}
	}

	// only unpaid txns where you are in assignees
	const pending = transactions.filter(t => {
		const assignees = getAssignees(t.assignees)
		return !t.paid && assignees.includes(currentUser)
	})

	// handler that fetches venmoUsername, marks paid, then deep-links
	async function handleSettle(tx) {
		const { id, createdBy, amount, description } = tx

		// fetch the user's Venmo handle
		let venmoUsername
		try {
			const userRes = await fetch(`/api/users/${createdBy}`)
			if (!userRes.ok) throw new Error('User lookup failed')
			const userData = await userRes.json()
			venmoUsername = userData.venmoUsername
		} catch (err) {
			console.error('Could not fetch Venmo username:', err)
			alert('Unable to look up Venmo info for this user.')
			return
		}

		// mark the expense paid in your DB
		try {
			const patch = await fetch(`/api/expenses/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ paid: true })
			})
			if (!patch.ok) throw new Error('Mark-paid failed')
			onSettle(id)
		} catch (err) {
			console.error('Error marking expense paid:', err)
			alert('Could not mark this expense as paid.')
			return
		}

		// deep-link into Venmo with description as note
		const amt = amount.toFixed(2)
		const note = encodeURIComponent(description)
		const appLink = `venmo://paycharge?txn=pay&recipients=${venmoUsername}&amount=${amt}&note=${note}`
		const webLink = `https://venmo.com/${venmoUsername}?txn=pay&amount=${amt}&note=${note}`

		window.location.href = appLink
		setTimeout(() => window.open(webLink, '_blank'), 500)
	}

	return (
		<div className="lg:row-span-2 bg-indigo-50 rounded-2xl shadow p-6 flex flex-col min-h-72">
			<h2 className="text-lg font-medium text-gray-900 mb-4">Pending Settlements</h2>
			<div
				className="
          bg-white
          rounded-lg
          p-6
          space-y-4
          shadow-inner
          overflow-y-auto
          flex-1
          max-h-80
        "
			>
				{pending.map(tx => (
					<div key={tx.id} className="flex justify-between items-center">
						<div>
							<p className="text-gray-800 font-medium">{tx.createdBy}</p>
							<p className="text-sm text-gray-500">{tx.category}</p>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-gray-800 font-semibold">
								${tx.amount.toFixed(2)}
							</span>
							<button
								onClick={() => handleSettle(tx)}
								className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
							>
								Settle
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
