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
		{ label: 'Total Spent', value: `$${sumAll.toLocaleString()}`, icon: FiDollarSign },
		{ label: 'Avg / Person', value: `$${avgPerPerson}`, icon: FiUsers },
		{ label: 'Transactions', value: `${txnCount}`, icon: FiList },
		{ label: 'Avg Spend', value: `$${avgTxnSize}`, icon: FiActivity },
	]

	return (
		<div className="lg:row-span-2 col-span-1 group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-2xl p-6 hover:shadow-2xl hover:shadow-amber-500/20 dark:hover:shadow-amber-400/30 transition-all duration-300 flex flex-col">
			<div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-amber-500/30 to-orange-500/30 dark:from-amber-400/40 dark:to-orange-400/40 rounded-full blur-2xl"></div>
			
			<h2 className="relative text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
				Spending Overview
			</h2>

			{/* Chart */}
			<div className="relative w-full mb-6">
				<SpendingBarChart transactions={transactions} />
			</div>

			{/* Stats grid */}
			<div className="relative grid grid-cols-1 gap-3">
				{stats.map(({ label, value, icon: Icon }) => (
					<div key={label} className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center p-3 rounded-xl">
						<div className="text-amber-600 dark:text-amber-400 p-2.5 rounded-xl bg-white dark:bg-gray-900 shadow-sm">
							<Icon className="w-5 h-5" />
						</div>
						<div className="ml-3">
							<p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
							<p className="text-base font-bold text-gray-900 dark:text-white">{value}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
