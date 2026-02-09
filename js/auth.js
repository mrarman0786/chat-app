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
    checkAuthStatus();

    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/check', {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.authenticated) {
                console.log('User already authenticated, redirecting to chat...');
                window.location.href = '/chat.html';
            }
        } catch (error) {
            console.log('User not authenticated, showing login page');
        }
    }

    // ============================================
    // TAB SWITCHING
    // ============================================
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            if (targetTab === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            } else {
                registerForm.classList.add('active');
                loginForm.classList.remove('active');
            }

            hideMessage();
        });
    });

    // ============================================
    // LOGIN FORM SUBMISSION
    // ============================================
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const submitBtn = document.getElementById('login-btn');

        if (!username || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }

        try {
            setButtonLoading(submitBtn, true);

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => { window.location.href = '/chat.html'; }, 1000);
            } else {
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

        if (!username || !email || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }

        if (username.length < 3) {
            showMessage('Username must be at least 3 characters', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            setButtonLoading(submitBtn, true);

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                showMessage('Account created! Please log in.', 'success');
                registerForm.reset();
                setTimeout(() => { tabButtons[0].click(); }, 1500);
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
    function showMessage(message, type) {
        messageContainer.classList.remove('hidden', 'success', 'error');
        messageContainer.classList.add(type);
        messageText.textContent = message;
    }

    function hideMessage() {
        messageContainer.classList.add('hidden');
    }

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
});

console.log('✅ Auth.js loaded successfully');
