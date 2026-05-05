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
		<div className="w-full max-w-md relative overflow-hidden bg-white border border-blue-100 rounded-2xl shadow-xl shadow-blue-500/10 p-8">
	
			
			{/* Logo */}
			<div className="relative flex justify-center mb-8">
				<div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-600 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
					<span className="text-white font-bold text-3xl">J</span>
				</div>
			</div>
			
			<div className="relative text-center mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					Welcome back
				</h1>
				<p className="text-gray-500 text-sm">Sign in to your account</p>
			</div>

			{/* Form */}
			<form className="relative space-y-5" onSubmit={handleSubmit}>
				<div>
					<label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
						Username
					</label>
					<input
						id="username"
						type="text"
						required
						value={username}
						onChange={e => setUsername(e.target.value)}
						placeholder="Enter your username"
						className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-gray-900 placeholder-gray-400 transition-all"
					/>
				</div>

				<div>
					<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
						Password
					</label>
					<input
						id="password"
						type="password"
						required
						value={password}
						onChange={e => setPassword(e.target.value)}
						placeholder="••••••••"
						className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-gray-900 placeholder-gray-400 transition-all"
					/>
				</div>

				{error && (
					<div className="flex items-center bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
						<span className="text-sm font-medium">{error}</span>
					</div>
				)}

				<button
					type="submit"
					className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all duration-200"
				>
					Sign In
				</button>
			</form>
		</div>
	)
}
