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
	const [users, setUsers] = useState([])
	const [transactions, setTransactions] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		async function fetchData() {
			try {
				const [expRes, usrRes] = await Promise.all([
					fetch('/api/expenses'),
					fetch('/api/users'),
				])
				const [expData, usrData] = await Promise.all([
					expRes.json(),
					usrRes.json(),
				])
				if (!expRes.ok) throw new Error(expData.message || `Error ${expRes.status}`)
				setTransactions(expData)
				setUsers(usrData)
			} catch (err) {
				console.error(err)
				setError(err.message)
			} finally {
				setLoading(false)
			}
		}
		fetchData()
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
	const avgPerPerson = users.length ? (sumAll / users.length).toFixed(2) : '0.00'
	const avgTxnSize = txnCount ? (sumAll / txnCount).toFixed(2) : '0.00'

	const stats = [
		{ label: 'Total Spent', value: `$${sumAll.toLocaleString()}`, icon: FiDollarSign },
		{ label: 'Avg / Person', value: `$${avgPerPerson}`, icon: FiUsers },
		{ label: 'Transactions', value: `${txnCount}`, icon: FiList },
		{ label: 'Avg Spend', value: `$${avgTxnSize}`, icon: FiActivity },
	]

	return (
		<div className="lg:row-span-2 col-span-1 bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200 flex flex-col">
			<p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Spending Overview</p>

			{/* Chart */}
			<div className="relative w-full mb-6">
				<SpendingBarChart transactions={transactions} />
			</div>

			{/* Stats grid */}
			<div className="grid grid-cols-1 gap-2">
				{stats.map(({ label, value, icon: Icon }) => (
					<div key={label} className="bg-gray-50 flex items-center p-3 rounded-xl">
						<div className="text-amber-500 p-2 rounded-lg bg-amber-50">
							<Icon className="w-4 h-4" />
						</div>
						<div className="ml-3">
							<p className="text-xs text-gray-400">{label}</p>
							<p className="text-sm font-bold text-gray-900">{value}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
