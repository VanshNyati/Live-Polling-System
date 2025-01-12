import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import StudentPage from './pages/Student';
import TeacherPage from './pages/Teacher';

const socket = io('https://intervuetask-backend.onrender.com');

function App() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const handleRoleSelection = (selectedRole) => {
    setRole(selectedRole);
  };

  return (
    <Router>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-lavender-100">
        <Routes>
          <Route
            path="/"
            element={
              !role ? (
                <div className="text-center space-y-8">
                  <h1 className="text-5xl font-extrabold tracking-tight text-gray-800">
                    Welcome to the <span className="text-indigo-500">Live Polling System</span>
                  </h1>
                  <p className="text-lg text-gray-600">
                    Select your role to get started!
                  </p>
                  <div className="flex justify-center space-x-8">
                    <button
                      onClick={() => handleRoleSelection('student')}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-6 rounded-xl shadow-lg font-semibold transform transition hover:scale-105"
                    >
                      I'm a Student
                    </button>
                    <button
                      onClick={() => handleRoleSelection('teacher')}
                      className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-6 rounded-xl shadow-lg font-semibold transform transition hover:scale-105"
                    >
                      I'm a Teacher
                    </button>
                  </div>
                </div>
              ) : (
                <Navigate to={role === 'student' ? '/student' : '/teacher'} />
              )
            }
          />
          <Route path="/student" element={<StudentPage />} />
          <Route path="/teacher" element={<TeacherPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
