'use client'

import { useRouter } from 'next/navigation'

export default function HealthWidget() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/dashboard/health')}
      className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-emerald-200 transition-shadow duration-200 flex flex-col text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <p className="text-xs text-gray-400 mb-0.5">Nutrition & Macros</p>
      <p className="font-semibold text-gray-900">My Metrics</p>
      <p className="text-xs text-emerald-500 font-medium mt-auto pt-3">Track →</p>
    </button>
  )
}
