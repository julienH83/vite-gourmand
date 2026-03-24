const { Pool } = require('pg');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT, 10),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'PostgreSQL pool error');
});

async function connectMongo() {
  const uri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`;
  await mongoose.connect(uri);
  logger.info('MongoDB connected');
}

module.exports = { pool, connectMongo };
