/**
 * ============================================
 * DATABASE CONNECTION MODULE
 * ============================================
 * 
 * Supports:
 * - Local development (.env)
 * - Railway (MYSQL_* variables)
 * - PlanetScale (DATABASE_URL)
 * - Render (DATABASE_URL)
 * 
 * ============================================
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Get database configuration
 * Supports multiple deployment platforms
 */
function getDbConfig() {
    // Check for DATABASE_URL (PlanetScale/Render format)
    if (process.env.DATABASE_URL) {
        console.log('📡 Using DATABASE_URL connection string');
        return process.env.DATABASE_URL;
    }

    // Railway or local development
    return {
        host: process.env.MYSQL_HOST || process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
        user: process.env.MYSQL_USER || process.env.MYSQLUSER || process.env.DB_USER || 'root',
        password: process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || process.env.DB_NAME || 'chat_app_db',

        // Pool configuration
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 30000,
    };
}

// Create connection pool
const config = getDbConfig();
const pool = typeof config === 'string'
    ? mysql.createPool(config)
    : mysql.createPool(config);

/**
 * Test database connection with retry logic
 */
async function testConnection(retries = 5, delay = 3000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const connection = await pool.getConnection();
            console.log('✅ Database connected successfully!');
            connection.release();
            return true;
        } catch (error) {
            console.error(`❌ Database connection attempt ${attempt}/${retries} failed`);
            console.error(`   Error: ${error.message}`);

            if (attempt < retries) {
                console.log(`   Retrying in ${delay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error('❌ All database connection attempts failed');
    return false;
}

/**
 * Execute a query with prepared statements
 */
async function query(sql, params = []) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
}

module.exports = {
    pool,
    query,
    testConnection,
    getDbConfig
};
