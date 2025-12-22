'use client'

// Imports
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const { status } = useSession()
	const router = useRouter()

	// If they’re already signed in, send them to the dashboard
	useEffect(() => {
		if (status === 'authenticated') {
			router.replace('/dashboard')
		}
	}, [status, router])

	async function handleSubmit(e) {
		e.preventDefault()
		setError('')

		const res = await signIn('credentials', {
			redirect: false,
			username,
			password,
		})

		if (res?.error) {
			setError('Invalid username or password')
		} else {
			router.push('/dashboard')
		}
	}

	return (
		<div className="w-full max-w-md relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-2xl shadow-2xl shadow-purple-500/10 dark:shadow-purple-400/20 p-8">
			<div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/30 to-blue-500/30 dark:from-purple-400/40 dark:to-blue-400/40 rounded-full blur-2xl"></div>
			
			{/* Logo */}
			<div className="relative flex justify-center mb-8">
				<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
					<span className="text-white font-bold text-3xl">J</span>
				</div>
			</div>
			
			<div className="relative text-center mb-8">
				<h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent mb-2">
					Welcome back
				</h1>
				<p className="text-gray-600 dark:text-gray-400 text-sm">Sign in to your account</p>
			</div>

			{/* Form */}
			<form className="relative space-y-5" onSubmit={handleSubmit}>
				<div>
					<label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Username
					</label>
					<input
						id="username"
						type="text"
						required
						value={username}
						onChange={e => setUsername(e.target.value)}
						placeholder="Enter your username"
						className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
					/>
				</div>

				<div>
					<label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Password
					</label>
					<input
						id="password"
						type="password"
						required
						value={password}
						onChange={e => setPassword(e.target.value)}
						placeholder="••••••••"
						className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
					/>
				</div>

				{error && (
					<div className="flex items-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl">
						<span className="text-sm font-medium">{error}</span>
					</div>
				)}

				<button
					type="submit"
					className="w-full py-3 bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 hover:from-purple-700 hover:via-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300"
				>
					Sign In
				</button>
			</form>
		</div>
	)
}
