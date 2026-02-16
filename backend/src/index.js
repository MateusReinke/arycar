import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 3001);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowsAnyOrigin = configuredOrigins.length === 0 || configuredOrigins.includes('*');

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowsAnyOrigin || configuredOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: !allowsAnyOrigin,
}));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    return res.status(200).json({ status: 'ok', db: 'connected', timestamp: result.rows[0].now });
  } catch (error) {
    return res.status(500).json({ status: 'error', db: 'disconnected', message: error.message });
  }
});

app.get('/api/version', (_req, res) => {
  res.json({ service: 'arycar-api', version: '1.2.0', message: 'APIs prontas para PostgreSQL: usuários, serviços, status e ordens.' });
});

app.get('/api/admin/default-user', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, active, created_at FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1`,
    );
    return res.status(200).json(rows[0] || null);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar admin padrão.', details: error.message });
  }
});

app.get('/api/users', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, phone, role, active, created_at FROM users ORDER BY created_at DESC');
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar usuários.', details: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email, phone, role } = req.body;
  if (!name || !role) {
    return res.status(400).json({ message: 'name e role são obrigatórios.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO users(name, email, phone, role)
       VALUES($1, NULLIF($2, ''), NULLIF($3, ''), $4)
       RETURNING id, name, email, phone, role, active, created_at`,
      [name, email || '', phone || '', role],
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao criar usuário.', details: error.message });
  }
});

app.get('/api/services', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, hours, needs_scheduling, products, observation, price_rule, per_unit, created_at, updated_at FROM services ORDER BY created_at DESC');
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar serviços.', details: error.message });
  }
});

app.post('/api/services', async (req, res) => {
  const { name, hours = 1, needsScheduling = false, products = '', observation = '', priceRule = '', perUnit = false } = req.body;
  if (!name) return res.status(400).json({ message: 'name é obrigatório.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO services(name, hours, needs_scheduling, products, observation, price_rule, per_unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, hours, needsScheduling, products, observation, priceRule, perUnit],
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao criar serviço.', details: error.message });
  }
});

app.get('/api/order-statuses', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, code, label, color_class, created_at FROM order_statuses ORDER BY created_at ASC');
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar status.', details: error.message });
  }
});

app.post('/api/order-statuses', async (req, res) => {
  const { code, label, colorClass } = req.body;
  if (!code || !label || !colorClass) return res.status(400).json({ message: 'code, label e colorClass são obrigatórios.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO order_statuses(code, label, color_class)
       VALUES($1, $2, $3)
       ON CONFLICT (code)
       DO UPDATE SET label = EXCLUDED.label, color_class = EXCLUDED.color_class
       RETURNING *`,
      [code, label, colorClass],
    );
    return res.status(200).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao salvar status.', details: error.message });
  }
});

app.get('/api/orders/open-by-plate/:plate', async (req, res) => {
  const plate = String(req.params.plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);

  if (plate.length !== 7) {
    return res.status(400).json({ message: 'Placa inválida. Use o formato ABC1D23 ou ABC1234.' });
  }

  try {
    const query = `
      SELECT
        c.id AS customer_id,
        c.name AS customer_name,
        c.cpf AS customer_cpf,
        COALESCE(c.phone, '') AS customer_phone,
        COALESCE(c.address, '') AS customer_address,
        v.id AS vehicle_id,
        v.plate AS vehicle_plate,
        v.type AS vehicle_type,
        v.size AS vehicle_size,
        COALESCE(v.brand, '') AS vehicle_brand,
        COALESCE(v.model, '') AS vehicle_model,
        COALESCE(v.color, '') AS vehicle_color,
        COALESCE(v.year, '') AS vehicle_year,
        COALESCE(v.km, '') AS vehicle_km,
        o.id AS order_id,
        o.status AS order_status,
        o.total AS order_total,
        o.created_at AS order_created_at
      FROM vehicles v
      INNER JOIN customers c ON c.id = v.customer_id
      LEFT JOIN orders o
        ON o.vehicle_id = v.id
        AND o.status IN ('waiting', 'in_progress')
      WHERE UPPER(v.plate) = $1
      ORDER BY o.created_at DESC NULLS LAST
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [plate]);

    if (rows.length === 0) return res.status(200).json({ found: false, openOrder: false });

    const row = rows[0];

    return res.status(200).json({
      found: true,
      openOrder: Boolean(row.order_id),
      customer: {
        id: row.customer_id,
        name: row.customer_name,
        cpf: row.customer_cpf,
        phone: row.customer_phone,
        address: row.customer_address,
      },
      vehicle: {
        id: row.vehicle_id,
        plate: row.vehicle_plate,
        type: row.vehicle_type,
        size: row.vehicle_size,
        brand: row.vehicle_brand,
        model: row.vehicle_model,
        color: row.vehicle_color,
        year: row.vehicle_year,
        km: row.vehicle_km,
        customerId: row.customer_id,
      },
      order: row.order_id
        ? {
            id: row.order_id,
            status: row.order_status,
            total: Number(row.order_total || 0),
            date: row.order_created_at,
          }
        : null,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao consultar placa no banco de dados.', details: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const {
    customerId,
    vehicleId,
    vehicleType,
    vehicleSize,
    total = 0,
    pickupDelivery = false,
    description = '',
    technicalNotes = '',
    status = 'waiting',
  } = req.body;

  if (!customerId || !vehicleId || !vehicleType || !vehicleSize) {
    return res.status(400).json({ message: 'customerId, vehicleId, vehicleType e vehicleSize são obrigatórios.' });
  }

  try {
    const open = await pool.query(
      `SELECT id FROM orders WHERE vehicle_id = $1 AND status IN ('waiting', 'in_progress') LIMIT 1`,
      [vehicleId],
    );

    if (open.rows.length > 0) {
      return res.status(409).json({ message: 'Já existe ordem em aberto para este veículo.', orderId: open.rows[0].id });
    }

    const { rows } = await pool.query(
      `INSERT INTO orders(customer_id, vehicle_id, vehicle_type, vehicle_size, total, pickup_delivery, description, technical_notes, status)
       VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [customerId, vehicleId, vehicleType, vehicleSize, total, pickupDelivery, description, technicalNotes, status],
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao criar ordem.', details: error.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`AryCar API on http://0.0.0.0:${port}`);
});
