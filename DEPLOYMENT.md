# 🚀 Railway Deployment Guide - Chat Application

Complete step-by-step guide to deploy your chat app on Railway.

---

## Prerequisites

- ✅ GitHub account with your code pushed
- ✅ Railway account (free at [railway.app](https://railway.app))

---

## Step 1: Create Railway Account

1. Go to **[railway.app](https://railway.app)**
2. Click **"Login"** → Sign in with **GitHub**
3. Authorize Railway to access your GitHub

---

## Step 2: Create New Project

1. Click **"New Project"** (or **"+ New"** button)
2. Select **"Deploy from GitHub repo"**
3. Find and select **`mrarman0786/chat-app`**
4. Click **"Deploy Now"**

> ⚠️ The first deploy will FAIL - that's expected! We need to add MySQL first.

---

## Step 3: Add MySQL Database

1. In your project dashboard, click **"+ New"**
2. Select **"Database"**
3. Choose **"MySQL"**
4. Wait 30-60 seconds for database to provision
5. You'll see a MySQL service appear in your project

---

## Step 4: Check MySQL Variables (Auto-configured)

Railway automatically creates these variables for MySQL:
- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLUSER`
- `MYSQLPASSWORD`
- `MYSQLDATABASE`

**To verify:**
1. Click on your **MySQL service**
2. Go to **"Variables"** tab
3. You should see all the MySQL variables listed

---

## Step 5: Add Session Secret to Node.js Service

1. Click on your **Node.js service** (chat-app)
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add these variables:

| Variable | Value |
|----------|-------|
| `SESSION_SECRET` | `railway-chat-app-secret-key-2024-production` |
| `NODE_ENV` | `production` |

> 💡 For SESSION_SECRET, use any random long string (32+ characters)

---

## Step 6: Create Database Tables

**CRITICAL STEP - Don't skip this!**

1. Click on your **MySQL service**
2. Go to **"Data"** tab (or **"Query"** tab)
3. Copy and paste this SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp)
);
```

4. Click **"Run Query"** or press Ctrl+Enter
5. You should see "Query executed successfully"

---

## Step 7: Redeploy Your App

1. Click on your **Node.js service** (chat-app)
2. Go to **"Deployments"** tab
3. Click **"Redeploy"** on the latest deployment
4. Wait for deployment to complete (1-2 minutes)

---

## Step 8: Generate Public URL

1. Click on your **Node.js service**
2. Go to **"Settings"** tab
3. Scroll to **"Networking"** section
4. Click **"Generate Domain"**
5. You'll get a URL like: `chat-app-production-xxxx.up.railway.app`

---

## Step 9: Test Your App! 🎉

1. Open your Railway URL in browser
2. Click **"Register"** tab
3. Create a new account:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
4. Login and start chatting!

---

## Troubleshooting

### ❌ "Database connection failed"
- Make sure MySQL service is running
- Check if tables were created (Step 6)
- Verify MySQL variables exist

### ❌ "Application crashed"
- Go to Deployments → View Logs
- Check for error messages
- Ensure all environment variables are set

### ❌ "Cannot connect to MySQL"
- Wait 1-2 minutes for MySQL to fully start
- Click Redeploy on your Node.js service

### ❌ "Session not working"
- Make sure `SESSION_SECRET` variable is set
- Make sure `NODE_ENV=production` is set

---

## Environment Variables Summary

Your Node.js service should have:

| Variable | Value | Required |
|----------|-------|----------|
| `SESSION_SECRET` | Random long string | ✅ Yes |
| `NODE_ENV` | `production` | ✅ Yes |
| `PORT` | (Railway sets automatically) | Auto |
| `MYSQLHOST` | (From MySQL service) | Auto |
| `MYSQLPORT` | (From MySQL service) | Auto |
| `MYSQLUSER` | (From MySQL service) | Auto |
| `MYSQLPASSWORD` | (From MySQL service) | Auto |
| `MYSQLDATABASE` | (From MySQL service) | Auto |

---

## Success Checklist

- [ ] Railway account created
- [ ] GitHub repo connected
- [ ] MySQL database added
- [ ] Database tables created (users, messages)
- [ ] SESSION_SECRET variable added
- [ ] NODE_ENV=production added
- [ ] App redeployed
- [ ] Public domain generated
- [ ] Can register and login
- [ ] Chat works in real-time

---

**Your app is now live! 🎉**

Share the Railway URL with others to chat in real-time!
