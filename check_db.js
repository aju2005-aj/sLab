require('dotenv').config({ path: './backend/.env' });
const { Client } = require('pg');

const client = new Client();

client.connect()
  .then(() => client.query('SELECT id, name, email, role FROM users'))
  .then(({ rows }) => {
    console.log('Users in DB:');
    console.table(rows);
  })
  .catch((err) => console.error('Database error:', err.message))
  .finally(() => client.end());
