'use client'

// Imports
import './globals.css'
import { usePathname, useRouter } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import AdminPanelButton from '@/components/AdminPanelButton'

export default function RootLayout({ children }) {
	const path = usePathname()
	const router = useRouter()
	const isLogin = path === '/login'

	return (
		<html lang="en">
			<head>
				<meta name="color-scheme" content="light" />
			</head>
			<body className="min-h-screen" style={{colorScheme: 'light'}}>
				<SessionProvider>
					{/* HEADER (hidden on /login) */}
					{!isLogin && (
						<header className="sticky top-0 z-50 border-b border-blue-100 bg-white shadow-sm">
						<div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-6">
							<button
								onClick={() => router.push('/dashboard')}
								className="flex items-center gap-3 hover:opacity-80 transition-opacity"
							>
								<div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md shadow-blue-500/30">
									<span className="text-white font-bold text-base">J</span>
								</div>
								<h1 className="text-lg font-bold text-blue-700">
									Jasper
								</h1>
							</button>
							<AdminPanelButton />
							</div>
						</header>
					)}

					{/* MAIN CONTENT */}
					<main className={isLogin ? '' : 'min-h-[calc(100vh-3.5rem-3rem)]'}>
						{children}
					</main>

					{/* FOOTER (hidden on /login) */}
					{!isLogin && (
						<footer className="border-t border-blue-100 bg-white/80">
							<div className="max-w-7xl mx-auto px-6 py-3">
								<p className="text-xs text-gray-400 text-center">
									© 2026 Jasper. All rights reserved.
								</p>
							</div>
						</footer>
					)}
				</SessionProvider>
			</body>
		</html>
	)
}
