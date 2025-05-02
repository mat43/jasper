'use client'

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
    <div className="
        w-full max-w-sm
        bg-white/80
        border border-white/30
        rounded-3xl
        shadow-2xl
        p-8
      ">
      {/* Logo */}
      <div className="flex justify-center mb-11 pt-8">
        <img
          src="/logo.png"
          alt="Jasper Logo"
          className="w-50"
        />
      </div>

      {/* Form */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        {error && (
          <div className="flex items-center bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-2xl space-x-2">
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="
            w-full py-3
            bg-gradient-to-r from-purple-600 to-blue-400
            text-white font-semibold rounded-lg
            hover:opacity-90 transition
          ">
          Log In
        </button>
      </form>
    </div>
  )
}
