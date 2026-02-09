-- ============================================
-- REAL-TIME CHAT APPLICATION DATABASE SCHEMA
-- ============================================
-- This file creates the database and tables required
-- for the chat application. Run this file in MySQL
-- before starting the application.
-- ============================================

-- Create the database
CREATE DATABASE IF NOT EXISTS chat_app_db;

-- Use the database
USE chat_app_db;

-- ============================================
-- USERS TABLE
-- ============================================
-- Stores registered user information
-- Password is stored as bcrypt hash for security
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- Unique identifier for each user
    username VARCHAR(50) NOT NULL UNIQUE,       -- Username (must be unique)
    email VARCHAR(100) NOT NULL UNIQUE,         -- Email address (must be unique)
    password VARCHAR(255) NOT NULL,             -- Bcrypt hashed password
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Account creation timestamp
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- MESSAGES TABLE
-- ============================================
-- Stores all chat messages with user reference
-- username is stored for quick retrieval without JOIN
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- Unique identifier for each message
    user_id INT NOT NULL,                       -- Reference to users table
    username VARCHAR(50) NOT NULL,              -- Username (denormalized for performance)
    message TEXT NOT NULL,                      -- The actual message content
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When the message was sent
    
    -- Foreign key constraint
    -- ON DELETE CASCADE: If user is deleted, their messages are also deleted
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
-- Index on timestamp for efficient message history retrieval
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

-- Index on user_id for efficient user message lookup
CREATE INDEX idx_messages_user_id ON messages(user_id);

-- ============================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================
-- Uncomment below to insert test data
-- Note: Password is 'password123' hashed with bcrypt
-- INSERT INTO users (username, email, password) VALUES 
-- ('testuser', 'test@example.com', '$2b$10$YourHashedPasswordHere');
