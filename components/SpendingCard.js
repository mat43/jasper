'use client'

import React, { useState, useEffect } from 'react'
import {
	FiDollarSign,
	FiUsers,
	FiList,
	FiActivity,
} from 'react-icons/fi'
import SpendingBarChart from './SpendingBarChart'

export default function SpendingCard() {
	const roommates = ['Mathew', 'Brycen', 'Nathan', 'Michael']
	const [transactions, setTransactions] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		async function fetchExpenses() {
			try {
				const res = await fetch('/api/expenses')
				const data = await res.json()
				if (!res.ok) throw new Error(data.message || `Error ${res.status}`)
				setTransactions(data)
			} catch (err) {
				console.error(err)
				setError(err.message)
			} finally {
				setLoading(false)
			}
		}
		fetchExpenses()
	}, [])

	if (loading) return <p>Loading…</p>
	if (error) return <p className="text-red-500">Error: {error}</p>

	const allTxns = transactions

	// breakdown by category
	const totalsMap = allTxns.reduce((acc, tx) => {
		acc[tx.category] = (acc[tx.category] || 0) + tx.amount
		return acc
	}, {})

	// basic stats
	const sumAll = allTxns.reduce((sum, tx) => sum + tx.amount, 0)
	const txnCount = allTxns.length
	const avgPerPerson = (sumAll / roommates.length).toFixed(2)
	const avgTxnSize = txnCount ? (sumAll / txnCount).toFixed(2) : '0.00'

	const stats = [
		{ label: 'Total Spent', value: `$${sumAll.toLocaleString()}`, icon: FiDollarSign, bg: 'bg-orange-100', iconColor: 'text-amber-600' },
		{ label: 'Avg / Person', value: `$${avgPerPerson}`, icon: FiUsers, bg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
		{ label: 'Transactions', value: `${txnCount}`, icon: FiList, bg: 'bg-green-100', iconColor: 'text-green-600' },
		{ label: 'Avg Spend', value: `$${avgTxnSize}`, icon: FiActivity, bg: 'bg-pink-100', iconColor: 'text-pink-600' },
	]

	return (
		<div className="row-span-2 col-span-1 p-6 rounded-2xl shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 flex flex-col transition-shadow duration-300 ease-in-out hover:shadow-xl">
			<h2 className="text-lg font-semibold text-gray-800 text-center mb-4">
				Spending Overview
			</h2>

			{/* Chart */}
			<div className="w-full mb-6">
				<SpendingBarChart transactions={transactions} />
			</div>

			{/* Stats grid */}
			<div className="grid grid-cols-1 gap-3">
				{stats.map(({ label, value, icon: Icon, bg, iconColor }) => (
					<div key={label} className={`${bg} flex items-center p-2 rounded-lg`}>
						<div className={`${iconColor} p-1 rounded-full bg-white/70`}>
							<Icon className="w-4 h-4" />
						</div>
						<div className="ml-2">
							<p className="text-xs text-gray-600 leading-tight">{label}</p>
							<p className="text-sm font-semibold text-gray-900 leading-tight">{value}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
