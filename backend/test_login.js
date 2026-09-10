require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client();

client.connect()
  .then(() => client.query("SELECT * FROM users WHERE email = 'admin@example.com'"))
  .then(({ rows }) => {
    const user = rows[0];
    if (!user) {
      console.log('User not found!');
      return;
    }
    console.log('User found in DB:', user);
    console.log("Password match for 'admin123':", bcrypt.compareSync('admin123', user.password));
  })
  .catch((err) => console.error('Database error:', err.message))
  .finally(() => client.end());
