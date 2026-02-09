/**
 * ============================================
 * SOCKET.IO REAL-TIME CHAT MODULE
 * ============================================
 */

const { query } = require('./db');

function initializeSocket(io, sessionMiddleware) {

    io.use((socket, next) => {
        sessionMiddleware(socket.request, {}, next);
    });

    io.on('connection', (socket) => {
        const session = socket.request.session;

        if (!session || !session.userId) {
            console.log('❌ Unauthenticated socket connection rejected');
            socket.disconnect(true);
            return;
        }

        socket.userId = session.userId;
        socket.username = session.username;

        console.log(`🔌 User connected: ${socket.username} (Socket: ${socket.id})`);

        socket.broadcast.emit('user joined', {
            username: socket.username,
            timestamp: new Date().toISOString()
        });

        socket.emit('welcome', {
            message: `Welcome to the chat, ${socket.username}!`,
            username: socket.username
        });

        socket.on('chat message', async (data) => {
            try {
                const { message } = data;

                if (!message || message.trim() === '') {
                    socket.emit('error', { message: 'Message cannot be empty' });
                    return;
                }

                const sanitizedMessage = message.trim().substring(0, 1000);
                const timestamp = new Date();

                const result = await query(
                    'INSERT INTO messages (user_id, username, message, timestamp) VALUES (?, ?, ?, ?)',
                    [socket.userId, socket.username, sanitizedMessage, timestamp]
                );

                console.log(`💬 Message from ${socket.username}: ${sanitizedMessage.substring(0, 50)}...`);

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

        socket.on('typing', () => {
            socket.broadcast.emit('user typing', { username: socket.username });
        });

        socket.on('stop typing', () => {
            socket.broadcast.emit('user stop typing', { username: socket.username });
        });

        socket.on('disconnect', (reason) => {
            console.log(`🔌 User disconnected: ${socket.username} (Reason: ${reason})`);
            socket.broadcast.emit('user left', {
                username: socket.username,
                timestamp: new Date().toISOString()
            });
        });

        socket.on('error', (error) => {
            console.error(`Socket error for ${socket.username}:`, error);
        });
    });

    console.log('✅ Socket.IO initialized');
}

module.exports = { initializeSocket };
