import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { FaUserTimes } from 'react-icons/fa';
import Chat from './Chat'; // Adjust the path as needed

const socket = io('http://localhost:5000');

const TeacherPage = () => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [timeLimit, setTimeLimit] = useState(60);
    const [correctOption, setCorrectOption] = useState(null);
    const [pollResults, setPollResults] = useState({});
    const [students, setStudents] = useState([]);
    const [pollActive, setPollActive] = useState(false);
    const [pastPolls, setPastPolls] = useState([]); 

    useEffect(() => {
        socket.on('pollEnded', (data) => {
            setPollActive(false);
            setPollResults(data); // Update results with question and options
        });

        socket.on('updateResults', (results) => {
            setPollResults(results);
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

        const fetchPastPolls = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/pastPolls');
                if (!response.ok) {
                    throw new Error('Failed to fetch past polls');
                }
                const data = await response.json();
                setPastPolls(data);
            } catch (error) {
                console.error('Error fetching past polls:', error);
            }
        };

        fetchPastPolls();

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
        <div className="relative flex flex-col md:flex-row items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="md:w-1/3 p-4">
                <h3 className="text-lg font-semibold mb-2">Connected Students:</h3>
                <ul className="bg-white p-4 rounded shadow-md">
                    {students.map((student, index) => (
                        <li key={index} className="border-b border-gray-300 py-2 flex justify-between items-center">
                            {student}
                            <FaUserTimes
                                className="text-red-500 cursor-pointer"
                                onClick={() => handleKickStudent(student)}
                            />
                        </li>
                    ))}
                </ul>
            </div>
            <div className="md:w-2/3 p-4">
                <h2 className="text-2xl font-bold mb-4">Create a Poll</h2>
                <form onSubmit={handleSubmit} className="flex flex-col items-stretch w-full max-w-md">
                    <label className="mb-2 text-lg font-semibold">Enter your question:</label>
                    <input
                        type="text"
                        value={question}
                        onChange={handleQuestionChange}
                        placeholder="Your question here"
                        className="border border-gray-300 rounded p-2 mb-4 w-full"
                        required
                    />
                    <label className="mb-2 text-lg font-semibold">Time Limit:</label>
                    <select
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(Number(e.target.value))}
                        className="border border-gray-300 rounded p-2 mb-4 w-full"
                    >
                        <option value={45}>45 seconds</option>
                        <option value={60}>60 seconds</option>
                        <option value={90}>90 seconds</option>
                    </select>
                    <h3 className="mb-2 text-lg font-semibold">Edit Options:</h3>
                    {options.map((option, index) => (
                        <div key={index} className="flex items-center mb-2">
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                placeholder={`Option ${index + 1}`}
                                className="border border-gray-300 rounded p-2 mb-4 w-full"
                                required
                            />
                            <label className="flex items-center ml-2">
                                <input
                                    type="radio"
                                    checked={correctOption === index}
                                    onChange={() => handleCorrectOptionChange(index)}
                                    className="mr-1"
                                />
                                Is Correct?
                            </label>
                        </div>
                    ))}
                    <button
                        type="submit"
                        className={`${pollActive ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                            } text-white font-semibold py-2 px-4 rounded shadow transition`}
                        disabled={pollActive}
                    >
                        Ask Question
                    </button>
                </form>
                <div className="mt-4 bg-white p-4 rounded shadow-md w-full">
                    <h3 className="text-lg font-semibold mb-4">Live Poll Results:</h3>
                    {pollResults && pollResults.votes ? (
                        <>
                            <p className="font-bold mb-2">{pollResults.question}</p>
                            <ul>
                                {Object.entries(pollResults.votes).map(([optionIndex, count]) => {
                                    const totalVotes = Object.values(pollResults.votes).reduce((a, b) => a + b, 0);
                                    const percentage = ((count / totalVotes) * 100).toFixed(1);
                                    return (
                                        <li key={optionIndex} className="mb-2">
                                            <div className="flex justify-between items-center">
                                                <span>{pollResults.options[optionIndex]}:</span>
                                                <span>{count} votes ({percentage}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-300 h-2 rounded">
                                                <div
                                                    className="bg-blue-500 h-2 rounded"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </>
                    ) : (
                        <p>No votes yet.</p>
                    )}
                </div>
                {/* <div className="mt-4">
                    <h3 className="text-lg font-semibold">Past Poll Results:</h3>
                    {pastPolls.length > 0 ? (
                        pastPolls.map((poll, index) => (
                            <div key={index} className="bg-white p-4 rounded shadow-md mb-4">
                                <h4 className="font-bold">{poll.question}</h4>
                                <ul>
                                    {poll.options.map((option, idx) => (
                                        <li key={idx}>
                                            {option}: {poll.results[idx] || 0} votes
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <p>No past polls available.</p>
                    )}
                </div> */}
            </div>
            <Chat senderName="Teacher" />
        </div>
    );
};

export default TeacherPage;
