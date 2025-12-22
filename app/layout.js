'use client'

// Imports
import './globals.css'
import { usePathname, useRouter } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function RootLayout({ children }) {
	const path = usePathname()
	const router = useRouter()
	const isLogin = path === '/login'
	const [mounted, setMounted] = useState(false)
	const [darkMode, setDarkMode] = useState(true)

	// Initialize dark mode on mount
	useEffect(() => {
		setMounted(true)
		const savedMode = localStorage.getItem('darkMode')
		const isDark = savedMode === null ? true : savedMode === 'true'
		setDarkMode(isDark)
		
		// Apply dark class immediately
		if (isDark) {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
	}, [])

	const toggleDarkMode = () => {
		const newMode = !darkMode
		setDarkMode(newMode)
		
		if (newMode) {
			document.documentElement.classList.add('dark')
			localStorage.setItem('darkMode', 'true')
		} else {
			document.documentElement.classList.remove('dark')
			localStorage.setItem('darkMode', 'false')
		}
	}

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta name="color-scheme" content="dark light" />
				<script
					dangerouslySetInnerHTML={{
						__html: `
							(function() {
								try {
									const savedMode = localStorage.getItem('darkMode');
									const isDark = savedMode === null ? true : savedMode === 'true';
									if (isDark) {
										document.documentElement.classList.add('dark');
									} else {
										document.documentElement.classList.remove('dark');
									}
								} catch (e) {}
							})();
						`,
					}}
				/>
			</head>
			<body className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" style={{colorScheme: darkMode ? 'dark' : 'light'}}>
				<SessionProvider>
					{/* HEADER (hidden on /login) */}
					{!isLogin && (
						<header className="sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl shadow-sm">
							<div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
								<button
									onClick={() => router.push('/dashboard')}
									className="flex items-center gap-3 hover:opacity-80 transition-opacity"
								>
									<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
										<span className="text-white font-bold text-lg">J</span>
									</div>
									<h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
										Jasper
									</h1>
								</button>
								<button
									onClick={toggleDarkMode}
									className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
									aria-label="Toggle dark mode"
								>
									{darkMode ? (
										<svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
										</svg>
									) : (
										<svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
											<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
										</svg>
									)}
								</button>
							</div>
						</header>
					)}

					{/* MAIN CONTENT */}
					<main className={isLogin ? '' : 'min-h-[calc(100vh-4rem-4rem)]'}>
						{children}
					</main>

					{/* FOOTER (hidden on /login) */}
					{!isLogin && (
						<footer className="border-t border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
							<div className="max-w-7xl mx-auto px-6 py-4">
								<p className="text-sm text-gray-600 dark:text-gray-400 text-center">
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
