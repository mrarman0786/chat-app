/**
 * ============================================
 * AUTHENTICATION JAVASCRIPT
 * ============================================
 * 
 * Handles client-side authentication:
 * - Form toggling between login/register
 * - Form validation
 * - API requests for auth endpoints
 * - Error/success message display
 * - Redirect on successful auth
 * 
 * VIVA EXPLANATION:
 * - Uses Fetch API for AJAX requests
 * - No page refresh required
 * - Client-side validation before server submission
 * - Proper error handling and user feedback
 * 
 * ============================================
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const messageContainer = document.getElementById('message-container');
    const messageText = document.getElementById('message-text');

    // ============================================
    // CHECK IF ALREADY LOGGED IN
    // ============================================
    // If user is already authenticated, redirect to chat
    checkAuthStatus();

    /**
     * Check if user is already authenticated
     * VIVA: This prevents logged-in users from seeing login page
     */
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/check', {
                credentials: 'include' // Include cookies
            });
            const data = await response.json();

            if (data.authenticated) {
                // User is logged in, redirect to chat
                console.log('User already authenticated, redirecting to chat...');
                window.location.href = '/chat.html';
            }
        } catch (error) {
            // Not logged in, stay on login page
            console.log('User not authenticated, showing login page');
        }
    }

    // ============================================
    // TAB SWITCHING
    // ============================================
    // Handle switching between login and register forms
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // Update tab button states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show/hide forms based on selected tab
            if (targetTab === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            } else {
                registerForm.classList.add('active');
                loginForm.classList.remove('active');
            }

            // Hide any messages
            hideMessage();
        });
    });

    // ============================================
    // LOGIN FORM SUBMISSION
    // ============================================
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const submitBtn = document.getElementById('login-btn');

        // ============================================
        // VALIDATE INPUT
        // ============================================
        if (!username || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }

        // ============================================
        // SEND LOGIN REQUEST
        // ============================================
        try {
            // Disable button and show loader
            setButtonLoading(submitBtn, true);

            // Make API request
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include' // Important: include cookies
            });

            const data = await response.json();

            if (data.success) {
                // Login successful
                showMessage('Login successful! Redirecting...', 'success');

                // Redirect to chat page after short delay
                setTimeout(() => {
                    window.location.href = '/chat.html';
                }, 1000);
            } else {
                // Login failed
                showMessage(data.message || 'Login failed', 'error');
                setButtonLoading(submitBtn, false);
            }

        } catch (error) {
            console.error('Login error:', error);
            showMessage('Connection error. Please try again.', 'error');
            setButtonLoading(submitBtn, false);
        }
    });

    // ============================================
    // REGISTER FORM SUBMISSION
    // ============================================
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const submitBtn = document.getElementById('register-btn');

        // ============================================
        // VALIDATE INPUT
        // ============================================
        if (!username || !email || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }

        // Validate username length
        if (username.length < 3) {
            showMessage('Username must be at least 3 characters', 'error');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }

        // ============================================
        // SEND REGISTER REQUEST
        // ============================================
        try {
            setButtonLoading(submitBtn, true);

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password }),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                // Registration successful
                showMessage('Account created! Please log in.', 'success');

                // Clear form
                registerForm.reset();

                // Switch to login tab after delay
                setTimeout(() => {
                    tabButtons[0].click(); // Click login tab
                }, 1500);
            } else {
                showMessage(data.message || 'Registration failed', 'error');
            }

            setButtonLoading(submitBtn, false);

        } catch (error) {
            console.error('Registration error:', error);
            showMessage('Connection error. Please try again.', 'error');
            setButtonLoading(submitBtn, false);
        }
    });

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Show a message to the user
     * @param {string} message - Message text
     * @param {string} type - 'success' or 'error'
     */
    function showMessage(message, type) {
        messageContainer.classList.remove('hidden', 'success', 'error');
        messageContainer.classList.add(type);
        messageText.textContent = message;
    }

    /**
     * Hide the message container
     */
    function hideMessage() {
        messageContainer.classList.add('hidden');
    }

    /**
     * Toggle button loading state
     * @param {HTMLElement} button - Button element
     * @param {boolean} isLoading - Loading state
     */
    function setButtonLoading(button, isLoading) {
        const btnText = button.querySelector('.btn-text');
        const btnLoader = button.querySelector('.btn-loader');

        if (isLoading) {
            button.disabled = true;
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
        } else {
            button.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    }

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================
    // Press Enter to submit focused form
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            const activeForm = document.querySelector('.auth-form.active');
            if (activeForm) {
                activeForm.dispatchEvent(new Event('submit'));
            }
        }
    });

});

console.log('✅ Auth.js loaded successfully');
