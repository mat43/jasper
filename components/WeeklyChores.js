'use client'

import { useState, useEffect } from 'react';
import { FiCheck, FiTrash2, FiPlus } from 'react-icons/fi';

export default function WeeklyChores() {
	const [chores, setChores] = useState([]);
	const [newLabel, setNewLabel] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [adding, setAdding] = useState(false);

	// Load chores
	useEffect(() => {
		fetch('/api/chores')
			.then(res => res.json())
			.then(data => setChores(Array.isArray(data) ? data : []))
			.catch(err => setError(err.message))
			.finally(() => setLoading(false));
	}, []);

	// Toggle completion
	const toggleDone = async (id, done) => {
		await fetch('/api/chores', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id, done: !done }),
		});
		setChores(cs => cs.map(c => c.id === id ? { ...c, done: !done } : c));
	};

	// Delete chore
	const deleteChore = async id => {
		await fetch('/api/chores', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id }),
		});
		setChores(cs => cs.filter(c => c.id !== id));
	};

	// Add new chore
	const addChore = async () => {
		if (!newLabel.trim()) return;
		setAdding(true);
		const res = await fetch('/api/chores', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ label: newLabel.trim() }),
		});
		const created = await res.json();
		if (res.ok) setChores(cs => [...cs, created]);
		setNewLabel(''); setAdding(false);
	};

	// Delegate chores
	const assignChores = async () => {
		const res = await fetch('/api/chores/assign', { method: 'POST' });
		const data = await res.json();
		if (res.ok && Array.isArray(data)) setChores(data);
	};

	return (
		<div className="row-span-2 flex flex-col p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
			{/* Header */}
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-lg font-semibold text-gray-800">Weekly Chores</h2>
				<button
					onClick={assignChores}
					className="text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors"
				>
					Delegate
				</button>
			</div>

			{/* Input */}
			<div className="flex items-center mb-4 space-x-2 min-w-0">
				<input
					type="text"
					className="flex-1 min-w-0 px-4 py-2 bg-white border border-emerald-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm placeholder-gray-500"
					value={newLabel}
					onChange={e => setNewLabel(e.target.value)}
					placeholder="Add new chore..."
					disabled={adding}
				/>
				<button
					onClick={addChore}
					disabled={adding}
					className="flex-shrink-0 p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors flex items-center justify-center"
				>
					<FiPlus className="w-5 h-5" />
				</button>
			</div>

			{/* Scrollable list */}
			<div className="flex-1 overflow-y-auto max-h-76">
				{loading ? (
					<p className="text-center text-gray-500">Loading chores...</p>
				) : error ? (
					<p className="text-center text-red-500">Error: {error}</p>
				) : (
					<ul className="space-y-2">
						{chores.map(({ id, label, done, assignedTo }) => (
							<li
								key={id}
								className="flex justify-between items-center p-3 bg-white bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-colors"
							>
								<div className="flex items-center space-x-3">
									<button
										onClick={() => toggleDone(id, done)}
										className="p-1 bg-white rounded-full hover:bg-emerald-100 transition-colors flex-shrink-0"
									>
										<FiCheck className={`w-5 h-5 ${done ? 'text-green-500' : 'text-gray-300'}`} />
									</button>
									<div>
										<div className={`${done ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>{label}</div>
										<div className="text-xs text-emerald-700 font-medium mt-1">{assignedTo || 'Unassigned'}</div>
									</div>
								</div>
								<button
									onClick={() => deleteChore(id)}
									className="p-1 bg-white rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
								>
									<FiTrash2 className="w-5 h-5 text-red-400 hover:text-red-600" />
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
