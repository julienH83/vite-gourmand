require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT, 10),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

async function seedPasswords() {
  const passwords = [
    { email: 'admin@vitegourmand.fr', password: 'Admin123!@#' },
    { email: 'employe@vitegourmand.fr', password: 'Admin123!@#' },
    { email: 'user@vitegourmand.fr', password: 'Admin123!@#' },
    { email: 'lucas@example.com', password: 'Admin123!@#' },
  ];

  for (const { email, password } of passwords) {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email]);
    console.log(`Updated password hash for ${email}`);
  }

  console.log('All passwords updated successfully');
  await pool.end();
  process.exit(0);
}

seedPasswords().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
