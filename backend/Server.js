const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'https://intervuetask-frontend.onrender.com', // Frontend URL
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors());

// Poll and connection state
let pollResults = {}; // Store results for the current poll
let connectedStudents = []; // Store names of connected students
let pollActive = false; // Track if a poll is active
let pastPolls = []; // Store past polls

// Socket.io event handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle student joining
    socket.on('studentJoin', (studentName) => {
        if (!connectedStudents.includes(studentName)) {
            connectedStudents.push(studentName);
            io.emit('studentConnected', studentName);
            socket.studentName = studentName; // Track the name in the socket
            console.log('Student connected:', studentName);
        } else {
            console.log('Duplicate student prevented:', studentName);
        }
    });

    // Handle creating a poll
    socket.on('createPoll', (pollData) => {
        if (!pollActive) {
            pollActive = true;
            pollResults = { question: pollData.question, options: pollData.options, votes: {} };
            io.emit('newQuestion', pollData);

            setTimeout(() => {
                pollActive = false;
                pastPolls.push({
                    question: pollData.question,
                    options: pollData.options,
                    results: { ...pollResults.votes },
                });
                io.emit('pollEnded', { question: pollData.question, options: pollData.options });
            }, pollData.timeLimit * 1000);
        } else {
            socket.emit('errorMessage', 'A poll is already active. Please wait until it ends.');
        }
    });

    // Handle submitting an answer
    socket.on('submitAnswer', (answerData) => {
        if (!pollResults.votes[answerData.answer]) {
            pollResults.votes[answerData.answer] = 0;
        }
        pollResults.votes[answerData.answer]++;
        io.emit('updateResults', pollResults);
    });

    // Handle kicking a student
    socket.on('kickStudent', (studentName) => {
        const targetSocket = Array.from(io.sockets.sockets.values()).find(
            (s) => s.studentName === studentName
        );

        if (targetSocket) {
            // Notify the student they were kicked
            targetSocket.emit('kickNotification');

            // Disconnect the student
            setTimeout(() => {
                targetSocket.disconnect(true); // Disconnect after the notification
            }, 100);
        }

        // Remove the student from the list
        connectedStudents = connectedStudents.filter((name) => name !== studentName);
        io.emit('studentDisconnected', studentName);
        console.log('Student kicked:', studentName);
    });

    // Handle chat messages
    socket.on('sendMessage', (data) => {
        const { senderName, message } = data;

        // Attach timestamp to the message
        const time = new Date().toLocaleTimeString();

        // Broadcast the message to all connected clients
        io.emit('receiveMessage', { senderName, message, time });
    });

    // Handle disconnects
    socket.on('disconnect', () => {
        if (socket.studentName) {
            connectedStudents = connectedStudents.filter((name) => name !== socket.studentName);
            io.emit('studentDisconnected', socket.studentName);
            console.log('Student disconnected:', socket.studentName);
        }
    });
});

// API to fetch past polls
app.get('/api/pastPolls', (req, res) => {
    res.json(pastPolls); // Send the stored past polls
});

// Optional: Health check endpoint (useful for deployment monitoring)
app.get('/health', (req, res) => {
    res.status(200).send('Server is healthy');
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
