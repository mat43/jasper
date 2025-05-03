import { Fragment } from 'react'
import Image from 'next/image'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { useSession } from "next-auth/react";

export default function ProfileCard({ name, avatarUrl, settingsOptions = [] }) {
  const { data: session } = useSession()

  return (
    <div className="relative bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center space-y-4">
      {/* Settings Menu */}
      <Menu as="div" className="absolute top-4 right-4">
        <MenuButton className="p-2 hover:bg-gray-100 rounded-full focus:outline-none">
          <EllipsisVerticalIcon className="w-6 h-6 text-gray-500" />
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
          <MenuItems className="absolute right-0 mt-2 z-50 w-40 bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden focus:outline-none">
            {settingsOptions.map((opt, idx) => (
              <MenuItem key={idx}>
                {({ active }) => (
                  <button
                    onClick={opt.onClick}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      active ? 'bg-gray-100' : ''
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

      {/* Avatar with Pastel Gradient Ring */}
      <div className="relative rounded-full bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 p-1">
        <div className="w-28 h-28 rounded-full overflow-hidden bg-white">
          <Image
            src={session?.user.avatarUrl || "/default.jpg"}
            alt={`${name} avatar`}
            width={112}
            height={112}
            className="object-cover"
          />
        </div>
      </div>

      {/* Name */}
      <h3 className="text-2xl font-semibold text-gray-900">{name}</h3>
    </div>
  )
}
