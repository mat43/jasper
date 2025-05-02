import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { from: 'bot', text: 'Hey! I’m Jasper. How can I help?' }
    ]);
    const [input, setInput] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        if (open && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, open]);

    const toggleOpen = () => setOpen(o => !o);

    const sendMessage = () => {
        if (!input.trim()) return;
        setMessages(msgs => [...msgs, { from: 'user', text: input }]);
        setInput('');
        setTimeout(() => {
            setMessages(msgs => [...msgs, { from: 'bot', text: "Sure—here’s what I found!" }]);
        }, 500);
    };

    return (
        <>
            {/* Chat toggle button */}
            <motion.button
                onClick={toggleOpen}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-6 right-6 bg-gradient-to-br from-blue-500 to-indigo-500 text-white p-4 rounded-2xl shadow-2xl z-50 backdrop-blur-sm"
                aria-label="Chat with Jasper"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    viewBox="0 0 512 512"
                    fill="currentColor"
                >
                    <path d="M64 0C28.7 0 0 28.7 0 64V352c0 35.3 28.7 64 64 64h96v80c0 6.1 
            3.4 11.6 8.8 14.3s11.9 2.1 16.8-1.5L309.3 416H448c35.3 0 64-28.7 
            64-64V64c0-35.3-28.7-64-64-64H64z"/>
                </svg>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-24 right-6 w-88 h-96 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-t-2xl">
                            <h3 className="text-white font-semibold">Chat with Jasper</h3>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {messages.map((m, i) => (
                                <div
                                    key={i}
                                    className={`max-w-[80%] px-3 py-2 rounded-lg shadow ${m.from === 'user'
                                            ? 'bg-blue-100 self-end text-blue-900'
                                            : 'bg-white self-start text-gray-800'}`}
                                >
                                    {m.text}
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div className="px-4 py-3 bg-white/90 border-t border-gray-200">
                            <div className="flex">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                    placeholder="Type a message…"
                                    className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={sendMessage}
                                    className="flex-none bg-gradient-to-br from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border border-transparent rounded-r-lg px-4 py-2 whitespace-nowrap transition"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
