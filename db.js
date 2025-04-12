require('dotenv').config();
const mysql = require('mysql2');
const url = require('url');

// Parse the connection URL
const dbUrl = new URL(process.env.DB_URL);

const pool = mysql.createPool({
  host: dbUrl.hostname,
  port: dbUrl.port,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1), // remove the '/' from pathname
  waitForConnections: true,
  connectTimeout: 10000,
  ssl: {
    rejectUnauthorized: false,
  }
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL database!');
    connection.release();
  }
});

module.exports = pool;
