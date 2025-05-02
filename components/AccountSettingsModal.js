import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AccountSettingsModal({ user, onClose }) {
    const [visible, setVisible] = useState(true);
    const [firstName, setFirstName] = useState(user.firstName || '');
    const [lastName, setLastName] = useState(user.lastName || '');
    const [email, setEmail] = useState(user.email || '');
    const [venmo, setVenmo] = useState(user.venmoUsername || '');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    // Prevent page scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    function handleClose() {
        setVisible(false);
    }

    function handleSubmit(e) {
        e.preventDefault();
        // TODO: call update API
        handleClose();
    }

    return (
        <AnimatePresence onExitComplete={onClose}>
            {visible && (
                <motion.div
                    key="overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/10"
                    onClick={handleClose}
                >
                    <motion.form
                        key="modal"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white/90 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                        onSubmit={handleSubmit}
                    >
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                            Account Settings
                        </h2>

                        <label className="block mb-4">
                            <span className="text-gray-700">Username</span>
                            <input
                                type="text"
                                value={user.username}
                                readOnly
                                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700"
                            />
                        </label>

                        <div className="flex gap-4 mb-4">
                            <label className="flex-1">
                                <span className="text-gray-700">First Name</span>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                                />
                            </label>
                            <label className="flex-1">
                                <span className="text-gray-700">Last Name</span>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                                />
                            </label>
                        </div>

                        <label className="block mb-4">
                            <span className="text-gray-700">Email</span>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                            />
                        </label>

                        <label className="block mb-4">
                            <span className="text-gray-700">Venmo Username</span>
                            <input
                                type="text"
                                value={venmo}
                                onChange={e => setVenmo(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                            />
                        </label>

                        <div className="flex gap-4 mb-6">
                            <label className="flex-1">
                                <span className="text-gray-700">New Password</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                                />
                            </label>
                            <label className="flex-1">
                                <span className="text-gray-700">Confirm Password</span>
                                <input
                                    type="password"
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                                />
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                        >
                            Save Changes
                        </button>
                    </motion.form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
