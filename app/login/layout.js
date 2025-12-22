export const metadata = {
	title: 'Jasper - Sign In',
}

export default function SignInLayout({ children }) {
	return (
		<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
			{children}
		</div>
	)
}
