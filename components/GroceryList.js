'use client'

import { useState, useEffect } from 'react';
import { FiCheck, FiTrash2, FiPlus } from 'react-icons/fi';

export default function GroceryList() {
	const [items, setList] = useState([]);
	const [newLabel, setNewLabel] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [adding, setAdding] = useState(false);

	// Load items
	useEffect(() => {
		fetch('/api/groceries')
			.then(res => res.json())
			.then(data => setList(Array.isArray(data) ? data : []))
			.catch(err => setError(err.message))
			.finally(() => setLoading(false));
	}, []);

	// Toggle completion
	const toggleDone = async (id, done) => {
		await fetch('/api/groceries', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id, done: !done }),
		});
		setList(cs => cs.map(c => c.id === id ? { ...c, done: !done } : c));
	};

	// Delete item
	const deleteItem = async id => {
		await fetch('/api/groceries', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id }),
		});
		setList(cs => cs.filter(c => c.id !== id));
	};

	// Add new item
	const addItem = async () => {
		if (!newLabel.trim()) return;
		setAdding(true);
		const res = await fetch('/api/groceries', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ label: newLabel.trim() }),
		});
		const created = await res.json();
		if (res.ok) setList(cs => [...cs, created]);
		setNewLabel(''); setAdding(false);
	};

	return (
		<div className="lg:row-span-2 flex flex-col group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-2xl p-6 hover:shadow-2xl hover:shadow-emerald-500/20 dark:hover:shadow-emerald-400/30 transition-all duration-300">
				<div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 dark:from-emerald-400/40 dark:to-teal-400/40 rounded-full blur-2xl"></div>
			<div className="relative flex justify-between items-center mb-4">
				<h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Grocery List</h2>
			</div>

			{/* Input */}
			<div className="relative flex items-stretch mb-4 gap-2">
				<input
					type="text"
					className="flex-1 min-w-0 px-4 py-2.5 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
					value={newLabel}
					onChange={e => setNewLabel(e.target.value)}
					placeholder="Add item..."
					disabled={adding}
					onKeyDown={e => e.key === 'Enter' && addItem()}
				/>
				<button
					onClick={addItem}
					disabled={adding}
					className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/50 transition-all duration-300 flex items-center justify-center"
				>
					<FiPlus className="w-5 h-5" />
				</button>
			</div>

			{/* Scrollable list */}
			<div className="relative flex-1 overflow-y-auto">
				{loading ? (
					<p className="text-center text-gray-500 dark:text-gray-400 py-4">Loading...</p>
				) : error ? (
					<p className="text-center text-red-500 py-4">Error: {error}</p>
				) : (
					<ul className="space-y-2">
						{items.map(({ id, label, done, assignedTo }) => (
							<li
								key={id}
								className="flex justify-between items-center p-3 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-all"
							>
								<div className="flex items-center space-x-3 flex-1 min-w-0">
									<button
										onClick={() => toggleDone(id, done)}
										className="flex-shrink-0 p-1.5 bg-white dark:bg-gray-900 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
									>
										<FiCheck className={`w-4 h-4 ${done ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'}`} />
									</button>
									<div className="flex-1 min-w-0">
										<div className={`text-sm ${done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white font-medium'}`}>{label}</div>
									</div>
								</div>
								<button
									onClick={() => deleteItem(id)}
									className="flex-shrink-0 p-1.5 bg-white dark:bg-gray-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
								>
									<FiTrash2 className="w-4 h-4 text-red-500" />
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
