import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const Chat = ({ senderName }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        socket.on('receiveMessage', (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        return () => {
            socket.off('receiveMessage');
        };
    }, []);

    const handleSendMessage = () => {
        if (newMessage.trim() !== '') {
            socket.emit('sendMessage', { senderName, message: newMessage });
            setNewMessage('');
        }
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    return (
        <div className="fixed right-4 bottom-4 bg-white border border-gray-300 rounded shadow-lg w-80 h-96 flex flex-col">
            <div className="bg-gray-800 text-white font-semibold p-2 rounded-t">
                Chat
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {messages.map((msg, index) => (
                    <div key={index} className="mb-2">
                        <div className="text-sm font-bold">{msg.senderName}</div>
                        <div className="text-xs text-gray-600">{msg.time}</div>
                        <div className="text-sm">{msg.message}</div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <div className="flex p-2 border-t border-gray-300">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded p-1 mr-2"
                />
                <button
                    onClick={handleSendMessage}
                    className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;
