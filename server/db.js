/**
 * ============================================
 * DATABASE CONNECTION MODULE
 * ============================================
 * 
 * Supports both local development and Railway deployment.
 * Railway uses different environment variable names.
 * 
 * ============================================
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Get database configuration
 * Supports both local (.env) and Railway environment variables
 */
function getDbConfig() {
    return {
        // Railway uses MYSQL_* variables, local uses DB_*
        host: process.env.MYSQL_HOST || process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
        user: process.env.MYSQL_USER || process.env.MYSQLUSER || process.env.DB_USER || 'root',
        password: process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || process.env.DB_NAME || 'chat_app_db',

        // Pool configuration
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,

        // Connection timeout
        connectTimeout: 30000,

        // Enable prepared statements
        namedPlaceholders: true,
    };
}

// Create connection pool
const pool = mysql.createPool(getDbConfig());

/**
 * Test database connection with retry logic
 */
async function testConnection(retries = 5, delay = 3000) {
    const config = getDbConfig();

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const connection = await pool.getConnection();
            console.log('✅ Database connected successfully!');
            console.log(`   📁 Database: ${config.database}`);
            console.log(`   🖥️  Host: ${config.host}:${config.port}`);
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
    console.error('   Please check your database configuration');
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
