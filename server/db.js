/**
 * ============================================
 * DATABASE CONNECTION MODULE
 * ============================================
 * 
 * Production-ready MySQL connection for Railway deployment.
 * Supports multiple environment variable formats.
 * 
 * ============================================
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Get database configuration from environment variables
 * Supports: Railway, Heroku, PlanetScale, and local development
 */
function getDbConfig() {
    // Railway uses these variable names
    const host = process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.MYSQLPORT || process.env.MYSQL_PORT || process.env.DB_PORT || '3306');
    const user = process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DB_USER || 'root';
    const password = process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
    const database = process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || 'chat_app_db';

    console.log('📊 Database Configuration:');
    console.log(`   Host: ${host}`);
    console.log(`   Port: ${port}`);
    console.log(`   User: ${user}`);
    console.log(`   Database: ${database}`);
    console.log(`   Password: ${password ? '****' : '(empty)'}`);

    return {
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: 60000,
    };
}

// Create connection pool
let pool = null;

function getPool() {
    if (!pool) {
        const config = getDbConfig();
        pool = mysql.createPool(config);
    }
    return pool;
}

/**
 * Test database connection with retry logic
 */
async function testConnection(retries = 10, delay = 5000) {
    const dbPool = getPool();

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`🔄 Database connection attempt ${attempt}/${retries}...`);
            const connection = await dbPool.getConnection();

            // Test the connection with a simple query
            await connection.query('SELECT 1');

            console.log('✅ Database connected successfully!');
            connection.release();
            return true;
        } catch (error) {
            console.error(`❌ Connection attempt ${attempt} failed: ${error.message}`);

            if (attempt < retries) {
                console.log(`   Waiting ${delay / 1000} seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    return false;
}

/**
 * Execute a query with prepared statements (prevents SQL injection)
 */
async function query(sql, params = []) {
    const dbPool = getPool();
    try {
        const [results] = await dbPool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
}

/**
 * Close the connection pool
 */
async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('Database pool closed');
    }
}

module.exports = {
    getPool,
    query,
    testConnection,
    closePool,
    getDbConfig
};
