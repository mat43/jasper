'use client'

// Imports
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraIcon } from '@heroicons/react/24/solid';

export default function AccountSettingsModal({ user, onClose }) {
	const [visible, setVisible] = useState(true);
	const [error, setError] = useState('');
	const DEFAULT_AVATAR = '/default.jpg';
	const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || DEFAULT_AVATAR);
	const [firstName, setFirstName] = useState(user.firstName || '');
	const [lastName, setLastName] = useState(user.lastName || '');
	const [email, setEmail] = useState(user.email || '');
	const [venmo, setVenmo] = useState(user.venmoUsername || '');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');

	// Prevent page scroll when modal is open
	useEffect(() => {
		document.body.style.overflow = 'hidden';
		return () => { document.body.style.overflow = ''; };
	}, []);

	const handleClose = () => setVisible(false);

	// Handle avatar change
	const handleAvatarChange = e => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => setAvatarPreview(reader.result);
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async e => {
		e.preventDefault();
		if (!firstName.trim() || !lastName.trim() || !email.trim() || !venmo.trim()) {
			return setError('First name, last name, email, and venmo username are required.');
		}
		if (password && password !== confirm) {
			return setError('Passwords do not match.');
		}
		if (password && password.length < 6) {
			return setError('Password must be at least 6 characters.');
		}

		setError('');
		// send everything as JSON, including the Base64 avatarPreview
		const payload = {
			firstName,
			lastName,
			email,
			venmo,
			avatar: avatarPreview, // this is a data URL string
			password,
			confirm,
		};
		const res = await fetch('/api/user/profile', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		if (res.ok) window.location.reload();
		else console.error(await res.text());
	};

	return (
		<AnimatePresence onExitComplete={onClose}>
			{visible && (
				<motion.div
					key="overlay"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
					onClick={handleClose}
				>
					<motion.form
						key="modal"
						initial={{ scale: 0.95, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.95, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-indigo-200/60 dark:border-indigo-800/60 rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4"
						onClick={e => e.stopPropagation()}
						onSubmit={handleSubmit}
					>
						{/* Gradient Orb */}
						<div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-3xl opacity-30 pointer-events-none" />
						
						<h2 className="relative text-2xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
							Account Settings
						</h2>

						{error && (
							<div className="relative mb-4 w-full rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-4 py-2 text-sm text-red-800 dark:text-red-400 shadow-sm text-center">
								{error}
							</div>
						)}

						{/* Avatar upload */}
						<div className="relative flex flex-col items-center mb-6">
							<div className="relative w-24 h-24">
								<img
									src={avatarPreview}
									alt="Avatar preview"
									className="w-full h-full object-cover rounded-full ring-4 ring-indigo-200/50 dark:ring-indigo-800/50 shadow-lg"
								/>
								<input
									type="file"
									accept="image/*"
									onChange={handleAvatarChange}
									className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
								/>
									<div className="absolute bottom-1 right-1 bg-gradient-to-br from-indigo-500 to-purple-500 p-2 rounded-full shadow-lg">
										<CameraIcon className="w-4 h-4 text-white" />
									</div>
								</div>
								<span className="mt-2 text-sm text-gray-700 dark:text-gray-300">Change Avatar</span>
						</div>

						<label className="relative block mb-4">
							<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</span>
							<input
								type="text"
								value={user.username}
								readOnly
								className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50 px-3 py-2 text-gray-700 dark:text-gray-300"
							/>
						</label>

						<div className="relative flex gap-4 mb-4">
							<label className="flex-1">
								<span className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</span>
								<input
									type="text"
									value={firstName}
									onChange={e => setFirstName(e.target.value)}
									className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/50 px-3 py-2 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
								/>
							</label>
							<label className="flex-1">
								<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</span>
								<input
									type="text"
									value={lastName}
									onChange={e => setLastName(e.target.value)}
									className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/50 px-3 py-2 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
								/>
							</label>
						</div>

						<label className="relative block mb-4">
							<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
							<input
								type="email"
								value={email}
								onChange={e => setEmail(e.target.value)}
								className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/50 px-3 py-2 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
							/>
						</label>

						<label className="relative block mb-4">
							<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Venmo Username</span>
							<input
								type="text"
								value={venmo}
								onChange={e => setVenmo(e.target.value)}
								className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/50 px-3 py-2 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
							/>
						</label>

						<div className="relative flex gap-4 mb-6">
							<label className="flex-1">
								<span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</span>
								<input
									type="password"
									value={password}
									onChange={e => setPassword(e.target.value)}
									className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/50 px-3 py-2 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
								/>
							</label>
							<label className="flex-1">
								<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</span>
								<input
									type="password"
									value={confirm}
									onChange={e => setConfirm(e.target.value)}
									className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/50 px-3 py-2 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
								/>
							</label>
						</div>

						<button
							type="submit"
							className="relative w-full px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all"
						>
							Save Changes
						</button>
					</motion.form>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
