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
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {kicked ? (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">You have been kicked out from the poll.</h2>
          <button
            onClick={() => (window.location.href = '/')}
            className="bg-red-500 text-white font-semibold py-2 px-4 rounded shadow hover:bg-red-600 transition"
          >
            Go Back to Home
          </button>
        </div>
      ) : !isNameEntered ? (
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4">Let’s Get Started</h2>
          <input
            type="text"
            value={studentName}
            onChange={handleNameChange}
            placeholder="Enter your Name"
            className="border border-gray-300 rounded p-2 mb-4"
            required
          />
          <button
            type="submit"
            className="bg-purple-600 text-white font-semibold py-2 px-4 rounded shadow hover:bg-purple-700 transition"
          >
            Continue
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center">
          {activeQuestion ? (
            <div className="bg-white p-4 rounded shadow-md w-full max-w-md">
              <h2 className="text-xl font-bold mb-2">{activeQuestion.question}</h2>
              <div className="mb-4">
                {activeQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="radio"
                      checked={selectedOption === index}
                      onChange={() => handleOptionChange(index)}
                      className="mr-2"
                    />
                    <label>{option}</label>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAnswerSubmit}
                className="bg-blue-500 text-white font-semibold py-2 px-4 rounded shadow hover:bg-blue-600 transition"
              >
                Submit Answer
              </button>
              <p className="mt-4">Time Remaining: {timer} seconds</p>
            </div>
          ) : submitted ? (
            <>
              <h2 className="text-2xl font-bold">Your answer has been submitted!</h2>
              {results && (
                <div className="mt-4 bg-white p-4 rounded shadow-md w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">Live Poll Results:</h3>
                  <p className="font-bold mb-2">{results.question}</p>
                  <ul>
                    {Object.entries(results.votes || {}).map(([optionIndex, count]) => {
                      const totalVotes = Object.values(results.votes || {}).reduce((a, b) => a + b, 0);
                      const percentage = ((count / totalVotes) * 100).toFixed(1);
                      return (
                        <li key={optionIndex} className="mb-2">
                          <div className="flex justify-between items-center">
                            <span>{results.options[optionIndex]}:</span>
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
                </div>
              )}
            </>
          ) : (
            <h2 className="text-2xl font-bold">Waiting for a question...</h2>
          )}
        </div>
      )}
      {isNameEntered && <Chat senderName={studentName} />}
    </div>
  );
};

export default StudentPage;
