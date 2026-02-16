import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;

const app = express();
const port = Number(process.env.PORT || 3001);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const rawCorsOrigin = process.env.CORS_ORIGIN || '*';
const allowedOrigins = rawCorsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    return res.status(200).json({
      status: 'ok',
      db: 'connected',
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      db: 'disconnected',
      message: error.message,
    });
  }
});

app.get('/api/version', (_req, res) => {
  res.json({
    service: 'arycar-api',
    version: '1.0.0',
    message: 'Backend base pronto para integrar endpoints do AryCar.',
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`AryCar API on http://0.0.0.0:${port}`);
});
