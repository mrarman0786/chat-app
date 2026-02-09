/**
 * ============================================
 * MAIN SERVER FILE
 * ============================================
 * 
 * Production-ready Express server for Railway deployment.
 * 
 * ============================================
 */

// Load environment variables FIRST
require('dotenv').config();

// Core modules
const express = require('express');
const http = require('http');
const path = require('path');

// Middleware
const cors = require('cors');
const bodyParser = require('body-parser');

// Socket.IO
const { Server } = require('socket.io');

// Custom modules
const sessionMiddleware = require('./session');
const { testConnection } = require('./db');
const { initializeSocket } = require('./socket');

// Routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');

// ============================================
// CREATE EXPRESS APP AND HTTP SERVER
// ============================================
const app = express();
const server = http.createServer(app);

// ============================================
// INITIALIZE SOCKET.IO
// ============================================
const io = new Server(server, {
    cors: {
        origin: '*',  // Allow all origins for Railway
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Trust proxy for Railway
app.set('trust proxy', 1);

// CORS - allow all for production
app.use(cors({
    origin: true,
    credentials: true
}));

// Parse JSON request bodies
app.use(bodyParser.json());

// Parse URL-encoded request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(sessionMiddleware);

// ============================================
// STATIC FILE SERVING
// ============================================
app.use(express.static(path.join(__dirname, '..')));

// ============================================
// HEALTH CHECK (for Railway)
// ============================================
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// ============================================
// PAGE ROUTES
// ============================================

// Login page (default)
app.get('/', (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/chat.html');
    }
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Chat page (protected)
app.get('/chat.html', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, '../chat.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// ============================================
// INITIALIZE SOCKET.IO WITH SESSION
// ============================================
initializeSocket(io, sessionMiddleware);

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;

async function startServer() {
    console.log('');
    console.log('============================================');
    console.log('🔄 STARTING CHAT APPLICATION SERVER');
    console.log('============================================');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Port: ${PORT}`);
    console.log('');

    // Test database connection with retries
    const dbConnected = await testConnection(10, 5000);

    if (!dbConnected) {
        console.error('');
        console.error('❌ FATAL: Could not connect to database!');
        console.error('');
        console.error('Please check your Railway MySQL configuration:');
        console.error('1. Add a MySQL database to your Railway project');
        console.error('2. Railway will automatically set MYSQL* environment variables');
        console.error('3. Make sure the MySQL service is running');
        console.error('');
        process.exit(1);
    }

    // Start listening
    server.listen(PORT, '0.0.0.0', () => {
        console.log('');
        console.log('============================================');
        console.log('🚀 CHAT APPLICATION SERVER STARTED');
        console.log('============================================');
        console.log(`📡 Listening on port: ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('============================================');
        console.log('');
    });
}

// Start the server
startServer();

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
