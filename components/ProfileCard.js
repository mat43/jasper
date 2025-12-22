'use client'

import { Fragment } from 'react'
import Image from 'next/image'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { useSession } from "next-auth/react";

export default function ProfileCard({ name, settingsOptions = [] }) {
	const { data: session } = useSession()

	return (
		<div className="h-full group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-blue-400/30 transition-all duration-300 flex flex-col items-center justify-center space-y-4">
				<div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-500/30 to-purple-500/30 dark:from-blue-400/40 dark:to-purple-400/40 rounded-full blur-2xl"></div>
			<Menu as="div" className="absolute top-4 right-4 z-10">
				<MenuButton className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
					<EllipsisVerticalIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
				</MenuButton>
				<Transition
					as={Fragment}
					enter="transition ease-out duration-100"
					enterFrom="transform opacity-0 scale-95"
					enterTo="transform opacity-100 scale-100"
					leave="transition ease-in duration-75"
					leaveFrom="transform opacity-100 scale-100"
					leaveTo="transform opacity-0 scale-95"
				>
					<MenuItems className="absolute right-0 mt-2 z-50 w-44 bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 rounded-xl shadow-xl overflow-hidden backdrop-blur-xl">
						{settingsOptions.map((opt, idx) => (
							<MenuItem key={idx}>
								{({ active }) => (
									<button
										onClick={opt.onClick}
										className={`w-full text-left px-4 py-3 text-sm transition-colors ${
											active
												? 'bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white'
												: 'text-gray-700 dark:text-gray-300'
										}`}
									>
										{opt.label}
									</button>
								)}
							</MenuItem>
						))}
					</MenuItems>
				</Transition>
			</Menu>

			{/* Avatar */}
			<div className="relative mt-2">
				<div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full blur-md opacity-75"></div>
				<div className="relative rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-1 shadow-xl">
					<div className="w-24 h-24 rounded-full overflow-hidden bg-white dark:bg-gray-900 ring-4 ring-white dark:ring-gray-900">
						<Image
							src={session?.user.avatarUrl || "/default.jpg"}
							alt={`${name} avatar`}
							width={96}
							height={96}
							className="object-cover"
						/>
					</div>
				</div>
			</div>

			{/* Name */}
			<h3 className="text-lg font-bold text-gray-900 dark:text-white relative">{name}</h3>
		</div>
	)
}
