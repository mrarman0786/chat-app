/**
 * ============================================
 * CHAT JAVASCRIPT
 * ============================================
 * 
 * Handles real-time chat functionality:
 * - Socket.IO connection
 * - Message sending and receiving
 * - Message history loading
 * - User notifications (join/leave)
 * - Typing indicators
 * - Auto-scroll
 * 
 * VIVA EXPLANATION:
 * Socket.IO provides real-time bidirectional communication
 * between the browser and server. Key events:
 * - 'chat message' - sent when user sends a message
 * - 'user joined' - broadcast when someone joins
 * - 'user left' - broadcast when someone disconnects
 * 
 * ============================================
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // ============================================
    // CHECK AUTHENTICATION
    // ============================================
    // Redirect to login if not authenticated
    checkAuth();

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const messagesContainer = document.getElementById('messages-container');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const currentUsernameEl = document.getElementById('current-username');
    const connectionStatus = document.getElementById('connection-status');
    const statusText = connectionStatus.querySelector('.status-text');
    const typingIndicator = document.getElementById('typing-indicator');
    const typingText = typingIndicator.querySelector('.typing-text');
    const welcomeMessage = document.getElementById('welcome-message');

    // ============================================
    // VARIABLES
    // ============================================
    let socket = null;     // Socket.IO connection
    let currentUser = null; // Current logged-in user
    let typingTimeout = null; // Timeout for typing indicator

    /**
     * Check if user is authenticated
     * VIVA: Protects the chat page from unauthorized access
     */
    async function checkAuth() {
        try {
            const response = await fetch('/api/auth/check', {
                credentials: 'include'
            });
            const data = await response.json();

            if (!data.authenticated) {
                // Not logged in, redirect to login page
                console.log('Not authenticated, redirecting to login...');
                window.location.href = '/';
                return;
            }

            // Store user info
            currentUser = data.user;
            currentUsernameEl.textContent = currentUser.username;

            // Initialize Socket.IO connection
            initSocket();

            // Load message history
            loadMessageHistory();

        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/';
        }
    }

    // ============================================
    // SOCKET.IO INITIALIZATION
    // ============================================
    /**
     * Initialize Socket.IO connection
     * VIVA: Creates WebSocket connection to server
     */
    function initSocket() {
        // Connect to Socket.IO server
        socket = io({
            // Send cookies with connection
            withCredentials: true
        });

        // ============================================
        // CONNECTION EVENTS
        // ============================================

        // Successfully connected
        socket.on('connect', () => {
            console.log('✅ Connected to chat server');
            updateConnectionStatus('connected');
        });

        // Disconnected from server
        socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from chat server:', reason);
            updateConnectionStatus('disconnected');
        });

        // Connection error
        socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            updateConnectionStatus('disconnected');
        });

        // Reconnecting
        socket.on('reconnecting', (attemptNumber) => {
            console.log('Reconnecting... attempt:', attemptNumber);
            updateConnectionStatus('connecting');
        });

        // ============================================
        // WELCOME MESSAGE
        // ============================================
        socket.on('welcome', (data) => {
            console.log('Welcome message:', data);
            // Update welcome message if needed
            if (welcomeMessage) {
                welcomeMessage.innerHTML = `<p>👋 ${data.message}</p>`;
            }
        });

        // ============================================
        // CHAT MESSAGE EVENT
        // ============================================
        socket.on('chat message', (data) => {
            console.log('Message received:', data);
            addMessage(data);
        });

        // ============================================
        // USER JOIN EVENT
        // ============================================
        socket.on('user joined', (data) => {
            console.log('User joined:', data);
            addNotification(`${data.username} joined the chat`, 'join');
        });

        // ============================================
        // USER LEFT EVENT
        // ============================================
        socket.on('user left', (data) => {
            console.log('User left:', data);
            addNotification(`${data.username} left the chat`, 'leave');
        });

        // ============================================
        // TYPING EVENTS
        // ============================================
        socket.on('user typing', (data) => {
            showTypingIndicator(data.username);
        });

        socket.on('user stop typing', (data) => {
            hideTypingIndicator();
        });

        // ============================================
        // ERROR EVENT
        // ============================================
        socket.on('error', (data) => {
            console.error('Socket error:', data);
            alert(data.message || 'An error occurred');
        });
    }

    // ============================================
    // LOAD MESSAGE HISTORY
    // ============================================
    /**
     * Fetch and display previous messages
     * VIVA: Called once when user joins the chat
     */
    async function loadMessageHistory() {
        try {
            const response = await fetch('/api/chat/messages?limit=50', {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success && data.messages.length > 0) {
                console.log(`Loading ${data.messages.length} messages from history`);

                // Hide welcome message
                if (welcomeMessage) {
                    welcomeMessage.style.display = 'none';
                }

                // Add each message to the container
                data.messages.forEach(msg => {
                    addMessage(msg, false); // Don't animate history
                });

                // Scroll to bottom
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error loading message history:', error);
        }
    }

    // ============================================
    // SEND MESSAGE
    // ============================================
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const message = messageInput.value.trim();

        // Validate message
        if (!message) {
            return;
        }

        // Check socket connection
        if (!socket || !socket.connected) {
            alert('Not connected to server. Please refresh the page.');
            return;
        }

        // ============================================
        // EMIT MESSAGE TO SERVER
        // ============================================
        // VIVA: socket.emit sends data to the server
        socket.emit('chat message', { message });

        // Clear input
        messageInput.value = '';

        // Stop typing indicator
        socket.emit('stop typing');

        // Focus back to input
        messageInput.focus();
    });

    // ============================================
    // TYPING INDICATOR
    // ============================================
    messageInput.addEventListener('input', () => {
        if (socket && socket.connected) {
            // Emit typing event
            socket.emit('typing');

            // Clear previous timeout
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }

            // Stop typing after 2 seconds of inactivity
            typingTimeout = setTimeout(() => {
                socket.emit('stop typing');
            }, 2000);
        }
    });

    // ============================================
    // LOGOUT
    // ============================================
    logoutBtn.addEventListener('click', async () => {
        try {
            // Disconnect socket first
            if (socket) {
                socket.disconnect();
            }

            // Call logout API
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                console.log('Logged out successfully');
            }

            // Redirect to login page
            window.location.href = '/';

        } catch (error) {
            console.error('Logout error:', error);
            // Redirect anyway
            window.location.href = '/';
        }
    });

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Add a message to the chat
     * @param {object} data - Message data
     * @param {boolean} animate - Whether to animate
     */
    function addMessage(data, animate = true) {
        // Hide welcome message
        if (welcomeMessage && welcomeMessage.style.display !== 'none') {
            welcomeMessage.style.display = 'none';
        }

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message ${data.username === currentUser.username ? 'own' : 'other'}`;
        if (!animate) {
            messageEl.style.animation = 'none';
        }

        // Format timestamp
        const time = formatTime(data.timestamp);

        // Build message HTML
        messageEl.innerHTML = `
            <div class="message-header">
                <span class="message-username">${escapeHtml(data.username)}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${escapeHtml(data.message)}</div>
        `;

        messagesContainer.appendChild(messageEl);

        // Scroll to bottom
        scrollToBottom();
    }

    /**
     * Add a notification to the chat
     * @param {string} message - Notification text
     * @param {string} type - 'join' or 'leave'
     */
    function addNotification(message, type) {
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification ${type}`;

        const icon = type === 'join' ? '→' : '←';
        notificationEl.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;

        messagesContainer.appendChild(notificationEl);
        scrollToBottom();
    }

    /**
     * Update connection status display
     * @param {string} status - 'connected', 'disconnected', 'connecting'
     */
    function updateConnectionStatus(status) {
        connectionStatus.className = `connection-status ${status}`;

        const statusMessages = {
            'connected': 'Connected',
            'disconnected': 'Disconnected',
            'connecting': 'Connecting...'
        };

        statusText.textContent = statusMessages[status] || status;
    }

    /**
     * Show typing indicator
     * @param {string} username - Username of typing user
     */
    function showTypingIndicator(username) {
        typingText.textContent = `${username} is typing`;
        typingIndicator.classList.remove('hidden');
    }

    /**
     * Hide typing indicator
     */
    function hideTypingIndicator() {
        typingIndicator.classList.add('hidden');
    }

    /**
     * Scroll messages container to bottom
     */
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Format timestamp to readable time
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Formatted time
     */
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Escape HTML to prevent XSS
     * VIVA: Critical for security - prevents malicious scripts in messages
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================

    // Focus input on any key press
    document.addEventListener('keydown', (e) => {
        // Skip if already focused on input or using modifier keys
        if (document.activeElement === messageInput || e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }

        // Focus input if typing a regular character
        if (e.key.length === 1) {
            messageInput.focus();
        }
    });

    // ============================================
    // BEFOREUNLOAD - Warn before leaving
    // ============================================
    window.addEventListener('beforeunload', (e) => {
        if (socket && socket.connected) {
            // Notify server of disconnect
            socket.disconnect();
        }
    });

});

console.log('✅ Chat.js loaded successfully');
