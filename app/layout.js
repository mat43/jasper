'use client'

// Imports
import './globals.css'
import { usePathname, useRouter } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import ChatWidget from '../components/ChatWidget'

export default function RootLayout({ children }) {
	const path = usePathname()
	const router = useRouter()
	const isLogin = path === '/login'

	return (
		<html lang="en">
			<body className="flex flex-col min-h-screen bg-slate-100">
				{/* Session provider allows us access authenication state in all our pages */}
				<SessionProvider>
					{/* HEADER (hidden on /login) */}
					{!isLogin && (
						<header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
							<div className="max-w-7xl mx-auto flex h-16 items-center px-8">
								<button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 active:bg-gray-200 hover:cursor-pointer rounded-lg transition">
									<img src="/home.png" alt="Home" className="w-5 h-5" />
								</button>
								<h1 className="ml-4 text-2xl font-medium text-gray-900 tracking-wide">
									Jasper
								</h1>
							</div>
						</header>
					)}

					{/* MAIN CONTENT */}
					{isLogin ? (
						<main className="flex-1">{children}</main>
					) : (
						<main className="flex-1 px-8 py-2">{children}</main>
					)}

					{/* CHAT WIDGET (hidden on /login) */}
					{!isLogin && <ChatWidget />}

					{/* FOOTER (hidden on /login) */}
					{!isLogin && (
						<footer className="bg-white border-t border-gray-200">
							<div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row items-center justify-between">
								<p className="text-sm text-gray-500">© 2025 Jasper. All rights reserved.</p>
							</div>
						</footer>
					)}
				</SessionProvider>
			</body>
		</html>
	)
}
