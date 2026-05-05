'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Settings } from 'lucide-react'
import AdminPanel from './AdminPanel'

export default function AdminPanelButton() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  if (!session?.user?.isAdmin) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Admin settings"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-colors"
      >
        <Settings className="w-3.5 h-3.5" />
        Admin
      </button>

      {open && <AdminPanel onClose={() => setOpen(false)} />}
    </>
  )
}
