import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Chat from './Chat'; // Adjust the path as needed

const socket = io('http://localhost:5000');

const StudentPage = () => {
  const [studentName, setStudentName] = useState('');
  const [isNameEntered, setIsNameEntered] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timer, setTimer] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState({});
  const [kicked, setKicked] = useState(false);

  useEffect(() => {
    const storedName = sessionStorage.getItem('studentName');
    if (storedName) {
      setStudentName(storedName);
      setIsNameEntered(true);
    }

    if (isNameEntered) {
      socket.emit('studentJoin', studentName);
    }

    socket.on('newQuestion', (questionData) => {
      setActiveQuestion(questionData);
      setSelectedOption(null);
      setTimer(questionData.timeLimit);
      setSubmitted(false);
      startTimer();
    });

    socket.on('updateResults', (pollResults) => {
      setResults(pollResults);
    });

    socket.on('kickNotification', () => {
      sessionStorage.removeItem('studentName');
      setKicked(true);
      setActiveQuestion(null);
      socket.disconnect();
    });

    socket.on('pollEnded', () => {
      setActiveQuestion(null);
    });

    return () => {
      socket.off('newQuestion');
      socket.off('updateResults');
      socket.off('kickNotification');
      socket.off('pollEnded');
    };
  }, [isNameEntered, studentName]);

  const startTimer = () => {
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setActiveQuestion(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleNameChange = (e) => {
    setStudentName(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (studentName) {
      sessionStorage.setItem('studentName', studentName);
      setIsNameEntered(true);
      socket.emit('studentJoin', studentName);
    }
  };

  const handleOptionChange = (index) => {
    setSelectedOption(index);
  };

  const handleAnswerSubmit = () => {
    if (selectedOption !== null && activeQuestion) {
      const answerData = {
        studentName,
        answer: selectedOption,
      };
      socket.emit('submitAnswer', answerData);
      setSubmitted(true);
      setActiveQuestion(null);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-lavender-100 p-8">
      {kicked ? (
        <div className="text-center bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-500 mb-4">You have been kicked out from the poll.</h2>
          <button
            onClick={() => (window.location.href = '/')}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
          >
            Go Back to Home
          </button>
        </div>
      ) : !isNameEntered ? (
        <form onSubmit={handleSubmit} className="flex flex-col items-center bg-white p-8 rounded-lg shadow-lg space-y-6">
          <h2 className="text-3xl font-bold text-gray-800">Let’s Get Started</h2>
          <p className="text-lg text-gray-600">
            Enter your name to join the live polling session.
          </p>
          <input
            type="text"
            value={studentName}
            onChange={handleNameChange}
            placeholder="Enter your Name"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
          >
            Continue
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center space-y-6 w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg">
          {activeQuestion ? (
            <div className="w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{activeQuestion.question}</h2>
              <div className="space-y-4">
                {activeQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className={`block w-full px-4 py-3 rounded-lg border cursor-pointer ${selectedOption === index
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 hover:bg-gray-100'
                      }`}
                  >
                    <input
                      type="radio"
                      value={index}
                      checked={selectedOption === index}
                      onChange={() => handleOptionChange(index)}
                      className="hidden"
                    />
                    {option}
                  </label>
                ))}
              </div>
              <button
                onClick={handleAnswerSubmit}
                className="mt-6 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
              >
                Submit Answer
              </button>
              <p className="mt-4 text-sm text-gray-600">Time Remaining: {timer} seconds</p>
            </div>
          ) : submitted ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Your answer has been submitted!</h2>
              {results && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{results.question}</h3>
                  <ul>
                    {Object.entries(results.votes || {}).map(([optionIndex, count]) => {
                      const totalVotes = Object.values(results.votes || {}).reduce((a, b) => a + b, 0);
                      const percentage = ((count / totalVotes) * 100).toFixed(1);
                      return (
                        <li key={optionIndex} className="mb-2">
                          <div className="flex justify-between items-center">
                            <span>{results.options[optionIndex]}:</span>
                            <span>
                              {count} votes ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 h-2 rounded">
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
          ) : (
            <h2 className="text-2xl font-bold text-gray-800">Waiting for a question...</h2>
          )}
        </div>
      )}
      {isNameEntered && !kicked && <Chat senderName={studentName} />}
    </div>
  );
};

export default StudentPage;
