/**
 * ============================================
 * MAIN SERVER FILE
 * ============================================
 * 
 * This is the entry point of the application.
 * It sets up:
 * - Express server with middleware
 * - Static file serving
 * - API routes
 * - Socket.IO for real-time communication
 * - Database connection
 * 
 * VIVA EXPLANATION:
 * The server uses a layered architecture:
 * 1. Express for HTTP handling and routing
 * 2. Socket.IO for WebSocket communication
 * 3. MySQL for data persistence
 * 4. Session middleware for authentication
 * 
 * ============================================
 */

// Load environment variables first
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
        origin: process.env.NODE_ENV === 'production'
            ? false
            : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// ============================================
// MIDDLEWARE SETUP
// ============================================

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? false
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Parse JSON request bodies
app.use(bodyParser.json());

// Parse URL-encoded request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware (must be before routes)
app.use(sessionMiddleware);

// ============================================
// STATIC FILE SERVING
// ============================================
// Serve files from the project root directory
app.use(express.static(path.join(__dirname, '..')));

// ============================================
// API ROUTES
// ============================================
// Mount authentication routes
app.use('/api/auth', authRoutes);

// Mount chat routes
app.use('/api/chat', chatRoutes);

// ============================================
// PAGE ROUTES
// ============================================

// Login page (default)
app.get('/', (req, res) => {
    // If already logged in, redirect to chat
    if (req.session && req.session.userId) {
        return res.redirect('/chat.html');
    }
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Chat page (protected)
app.get('/chat.html', (req, res) => {
    // Check if authenticated
    if (!req.session || !req.session.userId) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, '../chat.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
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
    console.log('🔄 Connecting to database...');

    // Test database connection with retries (5 attempts, 3 second delay)
    const dbConnected = await testConnection(5, 3000);

    if (!dbConnected) {
        console.error('❌ Failed to connect to database after multiple attempts');
        console.error('   Please check your environment variables:');
        console.error('   - MYSQL_HOST or DB_HOST');
        console.error('   - MYSQL_PORT or DB_PORT');
        console.error('   - MYSQL_USER or DB_USER');
        console.error('   - MYSQL_PASSWORD or DB_PASSWORD');
        console.error('   - MYSQL_DATABASE or DB_NAME');
        process.exit(1);
    }

    // Start the server
    server.listen(PORT, '0.0.0.0', () => {
        console.log('');
        console.log('============================================');
        console.log('🚀 CHAT APPLICATION SERVER STARTED');
        console.log('============================================');
        console.log(`📡 Server running on port: ${PORT}`);
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
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
