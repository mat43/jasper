'use client'

import { Fragment } from 'react'
import Image from 'next/image'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { useSession } from "next-auth/react";

export default function ProfileCard({ name, settingsOptions = [] }) {
	const { data: session } = useSession()

	return (
		<div className="relative h-full bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200 flex flex-col items-center justify-center space-y-4">
			<Menu as="div" className="absolute top-4 right-4 z-10">
				<MenuButton className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
					<EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
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
					<MenuItems className="absolute right-0 mt-2 z-50 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
						{settingsOptions.map((opt, idx) => (
							<MenuItem key={idx}>
								{({ active }) => (
									<button
										onClick={opt.onClick}
										className={`w-full text-left px-4 py-3 text-sm transition-colors ${
											active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
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
				<div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-blue-100 bg-gray-100">
					<Image
						src={session?.user.avatarUrl || "/default.jpg"}
						alt={`${name} avatar`}
						width={96}
						height={96}
						className="object-cover"
					/>
				</div>
			</div>

			{/* Name */}
			<h3 className="text-lg font-bold text-gray-900">{name}</h3>
		</div>
	)
}
