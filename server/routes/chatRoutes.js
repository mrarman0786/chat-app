/**
 * ============================================
 * CHAT ROUTES
 * ============================================
 * 
 * This module handles chat-related API endpoints:
 * - GET /api/chat/messages - Fetch message history
 * - GET /api/chat/user - Get current user info
 * 
 * All routes are protected by authentication middleware
 * 
 * VIVA EXPLANATION:
 * - Messages are loaded from database with pagination support
 * - Only authenticated users can access these endpoints
 * - User info endpoint is used by chat page to display username
 * 
 * ============================================
 */

const express = require('express');
const router = express.Router();

// Import database and authentication modules
const { query } = require('../db');
const { isAuthenticated } = require('../auth');

/**
 * GET /api/chat/messages
 * Fetch message history from database
 * 
 * Query params: 
 * - limit: Number of messages to fetch (default: 50)
 * - offset: Offset for pagination (default: 0)
 * 
 * Response: { success, messages }
 */
router.get('/messages', isAuthenticated, async (req, res) => {
    try {
        // Parse pagination parameters
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        // Validate limit (prevent abuse)
        const safeLimit = Math.min(Math.max(limit, 1), 100);

        // ============================================
        // FETCH MESSAGES FROM DATABASE
        // ============================================
        // Order by timestamp ascending to show oldest first
        // This allows new messages to appear at the bottom
        const messages = await query(
            `SELECT id, user_id, username, message, timestamp 
             FROM messages 
             ORDER BY timestamp ASC 
             LIMIT ? OFFSET ?`,
            [safeLimit, offset]
        );

        console.log(`📨 Fetched ${messages.length} messages for user: ${req.session.username}`);

        return res.status(200).json({
            success: true,
            messages: messages,
            count: messages.length
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching messages'
        });
    }
});

/**
 * GET /api/chat/user
 * Get current authenticated user info
 * Used by chat page to display username
 * 
 * Response: { success, user }
 */
router.get('/user', isAuthenticated, (req, res) => {
    return res.status(200).json({
        success: true,
        user: {
            id: req.session.userId,
            username: req.session.username,
            email: req.session.email
        }
    });
});

/**
 * GET /api/chat/stats
 * Get chat statistics (optional feature)
 * 
 * Response: { success, stats }
 */
router.get('/stats', isAuthenticated, async (req, res) => {
    try {
        // Get total message count
        const messageCount = await query(
            'SELECT COUNT(*) as total FROM messages'
        );

        // Get total user count
        const userCount = await query(
            'SELECT COUNT(*) as total FROM users'
        );

        return res.status(200).json({
            success: true,
            stats: {
                totalMessages: messageCount[0].total,
                totalUsers: userCount[0].total
            }
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

module.exports = router;
