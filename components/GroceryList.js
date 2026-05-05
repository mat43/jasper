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
		<div className="lg:row-span-2 flex flex-col bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200">
			<div className="flex justify-between items-center mb-4">
				<p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Grocery List</p>
			</div>

			{/* Input */}
			<div className="flex items-stretch mb-4 gap-2">
				<input
					type="text"
					className="flex-1 min-w-0 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 text-sm placeholder-gray-400 text-gray-900"
					value={newLabel}
					onChange={e => setNewLabel(e.target.value)}
					placeholder="Add item..."
					disabled={adding}
					onKeyDown={e => e.key === 'Enter' && addItem()}
				/>
				<button
					onClick={addItem}
					disabled={adding}
					className="shrink-0 w-11 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors duration-150 flex items-center justify-center"
				>
					<FiPlus className="w-5 h-5" />
				</button>
			</div>

			{/* Scrollable list */}
			<div className="flex-1 overflow-y-auto">
				{loading ? (
					<p className="text-center text-gray-400 py-4">Loading...</p>
				) : error ? (
					<p className="text-center text-red-500 py-4">Error: {error}</p>
				) : (
					<ul className="space-y-1.5">
						{items.map(({ id, label, done }) => (
							<li
								key={id}
								className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-150"
							>
								<div className="flex items-center space-x-3 flex-1 min-w-0">
									<button
										onClick={() => toggleDone(id, done)}
										className="shrink-0 p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-emerald-50 transition-colors"
									>
										<FiCheck className={`w-4 h-4 ${done ? 'text-emerald-500' : 'text-gray-300'}`} />
									</button>
									<div className="flex-1 min-w-0">
										<div className={`text-sm ${done ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>{label}</div>
									</div>
								</div>
								<button
									onClick={() => deleteItem(id)}
									className="shrink-0 p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-red-50 transition-colors"
								>
									<FiTrash2 className="w-4 h-4 text-red-400" />
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
