import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const Chat = ({ senderName }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(true);
    const chatEndRef = useRef(null);

    useEffect(() => {
        // Listen for incoming messages
        socket.on('receiveMessage', (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        // Handle socket disconnection
        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        return () => {
            socket.off('receiveMessage');
            socket.off('disconnect');
        };
    }, []);

    const handleSendMessage = () => {
        if (isConnected && newMessage.trim() !== '') {
            socket.emit('sendMessage', { senderName, message: newMessage });
            setNewMessage('');
        }
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    return (
        <div className="fixed right-4 bottom-4 bg-white border border-gray-300 rounded-lg shadow-lg w-80 h-96 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 text-white font-semibold p-3 rounded-t-lg flex justify-between items-center">
                <span>Chat</span>
                <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded-lg font-bold">
                    {senderName}
                </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`p-3 rounded-lg shadow-md ${msg.senderName === senderName
                            ? 'bg-indigo-100 self-end'
                            : 'bg-gray-100'
                            }`}
                    >
                        <div className="text-sm font-bold text-gray-800">{msg.senderName}</div>
                        <div className="text-sm text-gray-600">{msg.message}</div>
                        <div className="text-xs text-gray-400 text-right">{msg.time}</div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center p-3 border-t border-gray-200 bg-gray-50">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isConnected ? "Type a message..." : "Disconnected"}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring focus:ring-indigo-200"
                    disabled={!isConnected} // Disable input if not connected
                />
                <button
                    onClick={handleSendMessage}
                    className={`ml-2 px-4 py-2 rounded-lg shadow-md transition ${isConnected ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
                    disabled={!isConnected} // Disable button if not connected
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;
