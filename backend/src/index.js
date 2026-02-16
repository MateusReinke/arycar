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

const VEHICLE_TYPES = ['carro', 'moto', 'caminhao'];

const emptyPricing = () => ({ costP: 0, costM: 0, costG: 0, priceP: 0, priceM: 0, priceG: 0 });

const mapServiceRows = (services, pricingRows, typesRows) => {
  const pricingByService = pricingRows.reduce((acc, row) => {
    if (!acc[row.service_id]) acc[row.service_id] = {};

    acc[row.service_id][row.vehicle_type] = {
      costP: Number(row.cost_p || 0),
      costM: Number(row.cost_m || 0),
      costG: Number(row.cost_g || 0),
      priceP: Number(row.price_p || 0),
      priceM: Number(row.price_m || 0),
      priceG: Number(row.price_g || 0),
    };

    return acc;
  }, {});

  const typesByService = typesRows.reduce((acc, row) => {
    if (!acc[row.service_id]) acc[row.service_id] = [];
    acc[row.service_id].push(row.vehicle_type);
    return acc;
  }, {});

  return services.map((service) => ({
    id: service.id,
    name: service.name,
    hours: Number(service.hours || 1),
    needsScheduling: Boolean(service.needs_scheduling),
    products: service.products || '',
    observation: service.observation || '',
    priceRule: service.price_rule || '',
    perUnit: Boolean(service.per_unit),
    vehicleTypes: typesByService[service.id] || [...VEHICLE_TYPES],
    pricing: {
      carro: pricingByService[service.id]?.carro || emptyPricing(),
      moto: pricingByService[service.id]?.moto || emptyPricing(),
      caminhao: pricingByService[service.id]?.caminhao || emptyPricing(),
    },
  }));
};

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
  res.json({
    service: 'arycar-api',
    version: '1.3.0',
    message: 'PostgreSQL ativo com autenticação por cadastro e catálogo de serviços no banco.',
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { identifier, password = '' } = req.body;

  if (!identifier) return res.status(400).json({ message: 'identifier é obrigatório.' });

  const normalizedIdentifier = String(identifier).trim();

  try {
    if (normalizedIdentifier.includes('@')) {
      const { rows } = await pool.query(
        `SELECT id, name, email, role, active, password_hash
         FROM users
         WHERE LOWER(email) = LOWER($1)
         LIMIT 1`,
        [normalizedIdentifier],
      );

      if (!rows.length || !rows[0].active) {
        return res.status(401).json({ message: 'Usuário interno não encontrado.' });
      }

      const user = rows[0];
      if ((user.password_hash || '') !== password) {
        return res.status(401).json({ message: 'Credenciais inválidas.' });
      }

      return res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }

    const phone = normalizedIdentifier.replace(/\D/g, '');
    const { rows } = await pool.query(
      `SELECT id, name, phone FROM customers WHERE phone = $1 LIMIT 1`,
      [phone],
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Cliente não encontrado para este telefone.' });
    }

    const customer = rows[0];
    return res.status(200).json({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      role: 'customer',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro no login.', details: error.message });
  }
});

app.get('/api/admin/default-user', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, active, created_at
       FROM users
       WHERE role = 'admin'
       ORDER BY created_at ASC
       LIMIT 1`,
    );
    return res.status(200).json(rows[0] || null);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar admin padrão.', details: error.message });
  }
});

app.get('/api/users', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, role, active, created_at FROM users ORDER BY created_at DESC',
    );
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar usuários.', details: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email, phone, role, password = '123456' } = req.body;
  if (!name || !role) return res.status(400).json({ message: 'name e role são obrigatórios.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO users(name, email, phone, role, password_hash)
       VALUES($1, NULLIF($2, ''), NULLIF($3, ''), $4, $5)
       RETURNING id, name, email, phone, role, active, created_at`,
      [name, email || '', phone || '', role, password],
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao criar usuário.', details: error.message });
  }
});

app.get('/api/services', async (_req, res) => {
  try {
    const servicesResult = await pool.query(
      `SELECT id, name, hours, needs_scheduling, products, observation, price_rule, per_unit
       FROM services ORDER BY name ASC`,
    );

    const pricingResult = await pool.query(
      `SELECT service_id, vehicle_type, cost_p, cost_m, cost_g, price_p, price_m, price_g
       FROM service_pricing`,
    );

    const typesResult = await pool.query(
      `SELECT service_id, vehicle_type FROM service_vehicle_types`,
    );

    return res.status(200).json(mapServiceRows(servicesResult.rows, pricingResult.rows, typesResult.rows));
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar serviços.', details: error.message });
  }
});

app.post('/api/services', async (req, res) => {
  const service = req.body;
  if (!service?.name) return res.status(400).json({ message: 'name é obrigatório.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const inserted = await client.query(
      `INSERT INTO services(name, hours, needs_scheduling, products, observation, price_rule, per_unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        service.name,
        Number(service.hours || 1),
        Boolean(service.needsScheduling),
        service.products || '',
        service.observation || '',
        service.priceRule || '',
        Boolean(service.perUnit),
      ],
    );

    const serviceId = inserted.rows[0].id;
    const vehicleTypes = service.vehicleTypes?.length ? service.vehicleTypes : [...VEHICLE_TYPES];

    for (const type of vehicleTypes) {
      await client.query(
        `INSERT INTO service_vehicle_types(service_id, vehicle_type) VALUES ($1, $2)`,
        [serviceId, type],
      );

      const pricing = service.pricing?.[type] || emptyPricing();
      await client.query(
        `INSERT INTO service_pricing(service_id, vehicle_type, cost_p, cost_m, cost_g, price_p, price_m, price_g)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          serviceId,
          type,
          Number(pricing.costP || 0),
          Number(pricing.costM || 0),
          Number(pricing.costG || 0),
          Number(pricing.priceP || 0),
          Number(pricing.priceM || 0),
          Number(pricing.priceG || 0),
        ],
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({ id: serviceId });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ message: 'Erro ao criar serviço.', details: error.message });
  } finally {
    client.release();
  }
});

app.put('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  const service = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE services
         SET name = $1,
             hours = $2,
             needs_scheduling = $3,
             products = $4,
             observation = $5,
             price_rule = $6,
             per_unit = $7,
             updated_at = NOW()
       WHERE id = $8`,
      [
        service.name,
        Number(service.hours || 1),
        Boolean(service.needsScheduling),
        service.products || '',
        service.observation || '',
        service.priceRule || '',
        Boolean(service.perUnit),
        id,
      ],
    );

    await client.query('DELETE FROM service_vehicle_types WHERE service_id = $1', [id]);
    await client.query('DELETE FROM service_pricing WHERE service_id = $1', [id]);

    const vehicleTypes = service.vehicleTypes?.length ? service.vehicleTypes : [...VEHICLE_TYPES];
    for (const type of vehicleTypes) {
      await client.query('INSERT INTO service_vehicle_types(service_id, vehicle_type) VALUES ($1, $2)', [id, type]);
      const pricing = service.pricing?.[type] || emptyPricing();
      await client.query(
        `INSERT INTO service_pricing(service_id, vehicle_type, cost_p, cost_m, cost_g, price_p, price_m, price_g)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          type,
          Number(pricing.costP || 0),
          Number(pricing.costM || 0),
          Number(pricing.costG || 0),
          Number(pricing.priceP || 0),
          Number(pricing.priceM || 0),
          Number(pricing.priceG || 0),
        ],
      );
    }

    await client.query('COMMIT');
    return res.status(200).json({ ok: true });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ message: 'Erro ao atualizar serviço.', details: error.message });
  } finally {
    client.release();
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM services WHERE id = $1', [req.params.id]);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao remover serviço.', details: error.message });
  }
});

app.get('/api/order-statuses', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, code, label, color_class, created_at FROM order_statuses ORDER BY created_at ASC',
    );
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar status.', details: error.message });
  }
});

app.post('/api/order-statuses', async (req, res) => {
  const { code, label, colorClass } = req.body;
  if (!code || !label || !colorClass) {
    return res.status(400).json({ message: 'code, label e colorClass são obrigatórios.' });
  }

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
  const plate = String(req.params.plate || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 7);

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
    if (!rows.length) return res.status(200).json({ found: false, openOrder: false });

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
