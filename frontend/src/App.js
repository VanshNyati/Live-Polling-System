import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import StudentPage from "./pages/Student";
import TeacherPage from "./pages/Teacher";

const socket = io('http://localhost:5000');

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={
            !role ? (
              <>
                <h1 className="text-3xl font-bold mb-4">Welcome to the Live Polling System</h1>
                <p className="mb-6">Please select the role that best describes you to begin using the live polling system</p>
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={() => handleRoleSelection('student')}
                    className="bg-blue-500 text-white font-semibold py-2 px-4 rounded shadow hover:bg-blue-600 transition"
                  >
                    I’m a Student
                  </button>
                  <button
                    onClick={() => handleRoleSelection('teacher')}
                    className="bg-green-500 text-white font-semibold py-2 px-4 rounded shadow hover:bg-green-600 transition"
                  >
                    I’m a Teacher
                  </button>
                </div>
              </>
            ) : (
              <Navigate to={role === 'student' ? '/student' : '/teacher'} />
            )
          } />
          <Route path="/student" element={<StudentPage />} />
          <Route path="/teacher" element={<TeacherPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;