const mysql = require('../backend/node_modules/mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const files = ['schema.sql', 'seed.sql'];
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`[SKIP] ${file} not found`);
      continue;
    }
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`[RUN] ${file} ...`);
    try {
      await conn.query(sql);
      console.log(`[OK]  ${file}`);
    } catch (err) {
      console.error(`[ERR] ${file}: ${err.message}`);
    }
  }

  await conn.end();
  console.log('Done.');
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
