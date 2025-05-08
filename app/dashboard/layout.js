import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const metadata = {
	title: 'Jasper - Dashboard',
	description: 'Lets do some cool stuff',
}

export default async function DashboardLayout({ children }) {
	const session = await getServerSession(authOptions)
	if (!session) redirect('/login')
	return <>{children}</>
}
