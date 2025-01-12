import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { FaUserTimes } from 'react-icons/fa';
import Chat from './Chat'; // Adjust the path as needed

const socket = io('https://intervuetask-backend.onrender.com');

const TeacherPage = () => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [timeLimit, setTimeLimit] = useState(60);
    const [correctOption, setCorrectOption] = useState(null);
    const [pollResults, setPollResults] = useState(null);
    const [students, setStudents] = useState([]);
    const [pollActive, setPollActive] = useState(false);

    useEffect(() => {
        socket.on('pollEnded', (data) => {
            setPollActive(false);
            setPollResults(data); // Update results with question and options
        });

        socket.on('updateResults', (results) => {
            setPollResults(results); // Update live poll results
        });

        socket.on('studentConnected', (studentName) => {
            setStudents((prev) => [...prev, studentName]);
        });

        socket.on('studentDisconnected', (studentName) => {
            setStudents((prev) => prev.filter((name) => name !== studentName));
        });

        socket.on('errorMessage', (message) => {
            alert(message);
        });

        return () => {
            socket.off('pollEnded');
            socket.off('updateResults');
            socket.off('studentConnected');
            socket.off('studentDisconnected');
            socket.off('errorMessage');
        };
    }, []);

    const handleKickStudent = (studentName) => {
        socket.emit('kickStudent', studentName);
        alert(`${studentName} has been kicked out.`);
    };

    const handleQuestionChange = (e) => {
        setQuestion(e.target.value);
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleCorrectOptionChange = (index) => {
        setCorrectOption(index);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (correctOption === null) {
            alert('Please mark one option as correct before submitting.');
            return;
        }
        if (!pollActive) {
            setPollActive(true);
            socket.emit('createPoll', { question, options, timeLimit, correctOption });
            setQuestion('');
            setOptions(['', '', '', '']);
            setCorrectOption(null);
            alert('Question asked successfully!');
        }
    };

    return (
        <div className="grid md:grid-cols-3 gap-6 min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-lavender-100 p-8">
            <div className="col-span-1 bg-white text-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Connected Students</h3>
                <ul className="space-y-3">
                    {students.map((student, index) => (
                        <li
                            key={index}
                            className="flex justify-between items-center bg-gray-50 p-3 rounded-lg shadow-sm hover:bg-gray-100 transition"
                        >
                            <span>{student}</span>
                            <FaUserTimes
                                className="text-red-500 cursor-pointer hover:text-red-600"
                                onClick={() => handleKickStudent(student)}
                            />
                        </li>
                    ))}
                </ul>
            </div>

            <div className="col-span-2 bg-white text-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6">Create a Poll</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-lg font-semibold mb-2">Enter your question:</label>
                        <input
                            type="text"
                            value={question}
                            onChange={handleQuestionChange}
                            placeholder="Your question here"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-lg font-semibold mb-2">Time Limit:</label>
                        <select
                            value={timeLimit}
                            onChange={(e) => setTimeLimit(Number(e.target.value))}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value={45}>45 seconds</option>
                            <option value={60}>60 seconds</option>
                            <option value={90}>90 seconds</option>
                        </select>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Edit Options:</h3>
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-4 mb-4">
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        checked={correctOption === index}
                                        onChange={() => handleCorrectOptionChange(index)}
                                        className="w-4 h-4 text-indigo-500 focus:ring-indigo-500"
                                    />
                                    <span>Correct?</span>
                                </label>
                            </div>
                        ))}
                    </div>
                    <button
                        type="submit"
                        className={`w-full py-3 rounded-lg text-white font-semibold transition transform ${pollActive
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-indigo-500 hover:bg-indigo-600 hover:scale-105'
                            }`}
                        disabled={pollActive}
                    >
                        Ask Question
                    </button>
                </form>

                {pollResults && pollResults.votes && (
                    <div className="mt-8 bg-white text-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">Live Poll Results</h3>
                        <p className="font-bold mb-4">{pollResults.question}</p>
                        <ul>
                            {Object.entries(pollResults.votes).map(([index, count]) => {
                                const totalVotes = Object.values(pollResults.votes).reduce((a, b) => a + b, 0);
                                const percentage = ((count / totalVotes) * 100).toFixed(1);
                                return (
                                    <li key={index} className="mb-4">
                                        <div className="flex justify-between items-center">
                                            <span>{pollResults.options[index]}:</span>
                                            <span>
                                                {count} votes ({percentage}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-300 h-2 rounded">
                                            <div
                                                className="bg-indigo-500 h-2 rounded"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>

            <Chat senderName="Teacher" />
        </div>
    );
};

export default TeacherPage;
