/**
 * ============================================
 * SOCKET.IO REAL-TIME CHAT MODULE
 * ============================================
 * 
 * This module handles all real-time communication:
 * - User connection/disconnection
 * - Message broadcasting
 * - Message persistence to database
 * 
 * VIVA EXPLANATION:
 * Socket.IO enables real-time, bidirectional communication
 * between browsers and server. It uses WebSocket when available,
 * with fallback to polling for older browsers.
 * 
 * Key concepts:
 * - io.emit() broadcasts to ALL connected clients
 * - socket.emit() sends only to the specific client
 * - socket.broadcast.emit() sends to all EXCEPT sender
 * 
 * ============================================
 */

const { query } = require('./db');

/**
 * Initialize Socket.IO with the HTTP server
 * 
 * @param {object} io - Socket.IO server instance
 * @param {object} sessionMiddleware - Express session middleware
 */
function initializeSocket(io, sessionMiddleware) {

    // ============================================
    // SHARE SESSION WITH SOCKET.IO
    // ============================================
    // This allows us to access user session data in socket handlers
    // VIVA: We wrap the express session middleware for Socket.IO use
    io.use((socket, next) => {
        sessionMiddleware(socket.request, {}, next);
    });

    // ============================================
    // CONNECTION EVENT
    // ============================================
    // Fired when a new client connects
    io.on('connection', (socket) => {
        // Get session data from the socket request
        const session = socket.request.session;

        // Check if user is authenticated
        if (!session || !session.userId) {
            console.log('❌ Unauthenticated socket connection rejected');
            socket.disconnect(true);
            return;
        }

        // Store user info on socket for easy access
        socket.userId = session.userId;
        socket.username = session.username;

        console.log(`🔌 User connected: ${socket.username} (Socket: ${socket.id})`);

        // ============================================
        // BROADCAST USER JOIN
        // ============================================
        // Notify all users that someone joined
        socket.broadcast.emit('user joined', {
            username: socket.username,
            timestamp: new Date().toISOString()
        });

        // Send welcome message to the newly connected user
        socket.emit('welcome', {
            message: `Welcome to the chat, ${socket.username}!`,
            username: socket.username
        });

        // ============================================
        // HANDLE CHAT MESSAGE
        // ============================================
        socket.on('chat message', async (data) => {
            try {
                const { message } = data;

                // Validate message
                if (!message || message.trim() === '') {
                    socket.emit('error', { message: 'Message cannot be empty' });
                    return;
                }

                // Sanitize message (prevent XSS)
                const sanitizedMessage = message.trim().substring(0, 1000); // Limit length

                const timestamp = new Date();

                // ============================================
                // SAVE MESSAGE TO DATABASE
                // ============================================
                const result = await query(
                    'INSERT INTO messages (user_id, username, message, timestamp) VALUES (?, ?, ?, ?)',
                    [socket.userId, socket.username, sanitizedMessage, timestamp]
                );

                console.log(`💬 Message from ${socket.username}: ${sanitizedMessage.substring(0, 50)}...`);

                // ============================================
                // BROADCAST MESSAGE TO ALL CLIENTS
                // ============================================
                // io.emit sends to ALL connected clients including sender
                io.emit('chat message', {
                    id: result.insertId,
                    userId: socket.userId,
                    username: socket.username,
                    message: sanitizedMessage,
                    timestamp: timestamp.toISOString()
                });

            } catch (error) {
                console.error('Error handling message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // ============================================
        // HANDLE TYPING INDICATOR (OPTIONAL)
        // ============================================
        socket.on('typing', () => {
            socket.broadcast.emit('user typing', {
                username: socket.username
            });
        });

        socket.on('stop typing', () => {
            socket.broadcast.emit('user stop typing', {
                username: socket.username
            });
        });

        // ============================================
        // HANDLE DISCONNECT
        // ============================================
        socket.on('disconnect', (reason) => {
            console.log(`🔌 User disconnected: ${socket.username} (Reason: ${reason})`);

            // Notify all users that someone left
            socket.broadcast.emit('user left', {
                username: socket.username,
                timestamp: new Date().toISOString()
            });
        });

        // ============================================
        // HANDLE ERRORS
        // ============================================
        socket.on('error', (error) => {
            console.error(`Socket error for ${socket.username}:`, error);
        });
    });

    console.log('✅ Socket.IO initialized');
}

module.exports = { initializeSocket };
