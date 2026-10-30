const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'haibao',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 50,
  connectTimeout: 10000,
  dateStrings: true,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log('[db] MySQL 连接成功');
    return true;
  } catch (err) {
    console.warn('[db] MySQL 连接失败:', err.message);
    return false;
  }
}

async function getConnection() {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await pool.getConnection();
    } catch (err) {
      if (attempt === 1) throw err;
      console.warn('[db] 获取连接失败，重试一次:', err.message);
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }
}

async function query(sql, params) {
  try {
    const [rows] = await pool.query(sql, params || []);
    return rows;
  } catch (err) {
    // 连接失败时重试一次
    if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ETIMEDOUT') {
      console.warn('[db] 连接异常，尝试重新连接...');
      const ok = await testConnection();
      if (ok) {
        const [rows] = await pool.query(sql, params || []);
        return rows;
      }
    }
    console.error('[db] 查询失败:', err.message);
    console.error('[db] SQL:', sql);
    throw err;
  }
}

async function queryOne(sql, params) {
  const rows = await query(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
}

module.exports = { pool, query, queryOne, testConnection, getConnection };
