import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 3001);

const getRequiredEnv = (name) => {
  const value = process.env[name];

  if (!value || !String(value).trim()) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }

  return value;
};

const databaseConfig = {
  host: getRequiredEnv('DATABASE_HOST'),
  port: Number(getRequiredEnv('DATABASE_PORT')),
  database: getRequiredEnv('DATABASE_NAME'),
  user: getRequiredEnv('DATABASE_USER'),
  password: getRequiredEnv('DATABASE_PASSWORD'),
};

if (Number.isNaN(databaseConfig.port)) {
  throw new Error('Variável de ambiente inválida: DATABASE_PORT deve ser numérica');
}

const pool = new Pool(databaseConfig);
const DEFAULT_ADMIN_EMAIL = 'admin@arycar.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin@123';


const hashPassword = async (plainTextPassword) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(plainTextPassword), salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = async (plainTextPassword, storedPasswordHash) => {
  if (!storedPasswordHash) return false;
  if (!storedPasswordHash.includes(':')) return String(plainTextPassword) === String(storedPasswordHash);
  const [salt, savedHash] = String(storedPasswordHash).split(':');
  const derived = crypto.scryptSync(String(plainTextPassword), salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(savedHash, 'hex'), Buffer.from(derived, 'hex'));
};


const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '').slice(0, 20);

const sanitizeUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  role: row.role,
  active: row.active,
  cpf: row.cpf,
  address: row.address,
  birthDate: row.birth_date,
  emergencyContact: row.emergency_contact,
  department: row.department,
  jobTitle: row.job_title,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const ensureCoreAuthTables = async () => {
  await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(200) NOT NULL,
      email VARCHAR(200) UNIQUE,
      phone VARCHAR(20) UNIQUE,
      password_hash TEXT,
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'employee', 'customer')),
      active BOOLEAN NOT NULL DEFAULT TRUE,
      cpf VARCHAR(14),
      address TEXT,
      birth_date DATE,
      emergency_contact VARCHAR(120),
      department VARCHAR(120),
      job_title VARCHAR(120),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR(14)');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(120)');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(120)');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(120)');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_requests (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS policy_rules (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      code VARCHAR(120) NOT NULL UNIQUE,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    INSERT INTO policy_rules (code, title, description)
    VALUES
      ('password_min_length', 'Senha mínima de 8 caracteres', 'Regra base de proteção para credenciais.'),
      ('password_complexity', 'Senha com letras maiúsculas, minúsculas, número e símbolo', 'Aumenta a segurança contra ataques de força bruta.'),
      ('mandatory_password_rotation', 'Troca de senha para contas compartilhadas', 'Recomendado para usuários administrativos.')
    ON CONFLICT (code) DO NOTHING
  `);

  const adminPasswordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);

  await pool.query(
    `INSERT INTO users(name, email, password_hash, role, active)
     VALUES($1, $2, $3, 'admin', TRUE)
     ON CONFLICT (email) DO NOTHING`,
    ['Administrador padrão', DEFAULT_ADMIN_EMAIL, adminPasswordHash],
  );
};

const ensureBusinessTables = async () => {
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_type') THEN
        CREATE TYPE vehicle_type AS ENUM ('carro', 'moto', 'caminhao');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_size') THEN
        CREATE TYPE vehicle_size AS ENUM ('P', 'M', 'G');
      END IF;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(200) NOT NULL,
      cpf VARCHAR(11) UNIQUE NOT NULL,
      phone VARCHAR(11),
      address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      plate VARCHAR(7) UNIQUE NOT NULL,
      type vehicle_type NOT NULL,
      size vehicle_size NOT NULL,
      brand VARCHAR(100),
      model VARCHAR(100),
      color VARCHAR(50),
      year VARCHAR(4),
      km VARCHAR(10),
      customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(200) NOT NULL,
      hours NUMERIC(4,1) NOT NULL DEFAULT 1,
      needs_scheduling BOOLEAN NOT NULL DEFAULT FALSE,
      products TEXT,
      observation TEXT,
      price_rule TEXT,
      per_unit BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_pricing (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      vehicle_type vehicle_type NOT NULL,
      cost_p NUMERIC(10,2) NOT NULL DEFAULT 0,
      cost_m NUMERIC(10,2) NOT NULL DEFAULT 0,
      cost_g NUMERIC(10,2) NOT NULL DEFAULT 0,
      price_p NUMERIC(10,2) NOT NULL DEFAULT 0,
      price_m NUMERIC(10,2) NOT NULL DEFAULT 0,
      price_g NUMERIC(10,2) NOT NULL DEFAULT 0,
      UNIQUE(service_id, vehicle_type)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_vehicle_types (
      service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      vehicle_type vehicle_type NOT NULL,
      PRIMARY KEY (service_id, vehicle_type)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      customer_id UUID NOT NULL REFERENCES customers(id),
      vehicle_id UUID NOT NULL REFERENCES vehicles(id),
      vehicle_type vehicle_type NOT NULL,
      vehicle_size vehicle_size NOT NULL,
      total NUMERIC(10,2) NOT NULL,
      pickup_delivery BOOLEAN NOT NULL DEFAULT FALSE,
      description TEXT,
      technical_notes TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'waiting',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      finished_at TIMESTAMPTZ,
      CONSTRAINT orders_total_non_negative CHECK (total >= 0)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      service_id UUID NOT NULL REFERENCES services(id),
      service_name VARCHAR(200) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
      unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
      unit_cost NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0),
      subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_statuses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      code VARCHAR(50) UNIQUE NOT NULL,
      label VARCHAR(100) NOT NULL,
      color_class VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(50) PRIMARY KEY,
      value TEXT
    )
  `);

  await pool.query(`
    INSERT INTO order_statuses (code, label, color_class)
    VALUES
      ('waiting', 'Aguardando', 'bg-yellow-500/10 border-yellow-500/40'),
      ('in_progress', 'Em Andamento', 'bg-blue-500/10 border-blue-500/40'),
      ('done', 'Finalizado', 'bg-green-500/10 border-green-500/40'),
      ('delivered', 'Entregue', 'bg-muted border-border')
    ON CONFLICT (code) DO NOTHING
  `);

  await pool.query(`INSERT INTO settings (key, value) VALUES ('whatsapp_number', '') ON CONFLICT (key) DO NOTHING`);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_customers_cpf ON customers(cpf)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_vehicle ON orders(vehicle_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_order_per_vehicle
      ON orders(vehicle_id)
      WHERE status IN ('waiting', 'in_progress')
  `);
};

const ensureInventoryFeature = async () => {
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unit_enum') THEN
        CREATE TYPE unit_enum AS ENUM ('ml', 'l', 'g', 'kg', 'un');
      END IF;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(200) NOT NULL UNIQUE,
      unit unit_enum NOT NULL,
      stock_current NUMERIC(14,3) NOT NULL DEFAULT 0,
      stock_min NUMERIC(14,3) NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`ALTER TABLE services ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE`);
  await pool.query(`ALTER TABLE services ADD COLUMN IF NOT EXISTS average_time_minutes INTEGER NOT NULL DEFAULT 60`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_products (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id),
      qty NUMERIC(14,3) NOT NULL CHECK (qty > 0),
      unit unit_enum NOT NULL,
      waste_factor NUMERIC(6,4) NOT NULL DEFAULT 0 CHECK (waste_factor >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (service_id, product_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      product_id UUID NOT NULL REFERENCES products(id),
      work_order_item_id UUID,
      service_id UUID,
      movement_type VARCHAR(20) NOT NULL,
      qty NUMERIC(14,3) NOT NULL,
      unit unit_enum NOT NULL,
      stock_before NUMERIC(14,3) NOT NULL,
      stock_after NUMERIC(14,3) NOT NULL,
      details JSONB NOT NULL DEFAULT '{}'::JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'`);
  await pool.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS done_at TIMESTAMPTZ`);

  await pool.query(`
    CREATE OR REPLACE FUNCTION convert_unit(qty NUMERIC, from_unit unit_enum, to_unit unit_enum)
    RETURNS NUMERIC
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF from_unit = to_unit THEN
        RETURN qty;
      END IF;

      IF from_unit = 'ml' AND to_unit = 'l' THEN RETURN qty / 1000; END IF;
      IF from_unit = 'l' AND to_unit = 'ml' THEN RETURN qty * 1000; END IF;
      IF from_unit = 'g' AND to_unit = 'kg' THEN RETURN qty / 1000; END IF;
      IF from_unit = 'kg' AND to_unit = 'g' THEN RETURN qty * 1000; END IF;

      RAISE EXCEPTION 'Conversão de unidade não suportada: % -> %', from_unit, to_unit;
    END;
    $$
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION consume_stock_on_done(p_order_item_id UUID)
    RETURNS VOID
    LANGUAGE plpgsql
    AS $$
    DECLARE
      rec RECORD;
      product_row RECORD;
      needed_qty NUMERIC(14,3);
      before_qty NUMERIC(14,3);
      after_qty NUMERIC(14,3);
    BEGIN
      FOR rec IN
        SELECT
          oi.id AS order_item_id,
          oi.quantity AS order_qty,
          oi.service_id,
          sp.product_id,
          sp.qty AS recipe_qty,
          sp.unit AS recipe_unit,
          sp.waste_factor,
          p.name AS product_name,
          p.unit AS product_unit,
          p.stock_current,
          p.active
        FROM order_items oi
        INNER JOIN service_products sp ON sp.service_id = oi.service_id
        INNER JOIN products p ON p.id = sp.product_id
        WHERE oi.id = p_order_item_id
      LOOP
        IF rec.active IS NOT TRUE THEN
          RAISE EXCEPTION 'Produto % está inativo e não pode ter baixa automática.', rec.product_name;
        END IF;

        needed_qty := convert_unit(rec.recipe_qty, rec.recipe_unit, rec.product_unit) * rec.order_qty * (1 + rec.waste_factor);

        SELECT stock_current INTO before_qty
        FROM products
        WHERE id = rec.product_id
        FOR UPDATE;

        after_qty := before_qty - needed_qty;

        IF after_qty < 0 THEN
          RAISE EXCEPTION 'Estoque insuficiente para % (atual: %, necessário: %, déficit: %)',
            rec.product_name,
            before_qty,
            needed_qty,
            ABS(after_qty);
        END IF;

        UPDATE products
        SET stock_current = after_qty,
            updated_at = NOW()
        WHERE id = rec.product_id;

        INSERT INTO stock_movements (
          product_id,
          work_order_item_id,
          service_id,
          movement_type,
          qty,
          unit,
          stock_before,
          stock_after,
          details
        ) VALUES (
          rec.product_id,
          rec.order_item_id,
          rec.service_id,
          'service_consumption',
          needed_qty,
          rec.product_unit,
          before_qty,
          after_qty,
          jsonb_build_object(
            'recipe_qty', rec.recipe_qty,
            'recipe_unit', rec.recipe_unit,
            'waste_factor', rec.waste_factor,
            'order_qty', rec.order_qty
          )
        );
      END LOOP;
    END;
    $$
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_service_products_service_id ON service_products(service_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_service_products_product_id ON service_products(product_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_stock_alert ON products(stock_current, stock_min)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_stock_movements_order_item ON stock_movements(work_order_item_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_order_items_status_done ON order_items(status, done_at)`);

  await pool.query(`
    INSERT INTO products (name, unit, stock_current, stock_min)
    VALUES
      ('Shampoo Neutro', 'l', 20, 5),
      ('Cera Líquida', 'ml', 8000, 1500),
      ('Pano Microfibra', 'un', 80, 20)
    ON CONFLICT (name) DO NOTHING
  `);
};


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
  res.json({
    service: 'arycar-api',
    version: '1.2.0',
    message: 'APIs prontas para PostgreSQL: usuários, serviços, status e ordens.',
  });
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

app.get('/api/products', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name, unit, stock_current AS "stockCurrent", stock_min AS "stockMin", active
      FROM products
      ORDER BY name ASC
    `);
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar produtos.', details: error.message });
  }
});

app.get('/api/stock/alerts', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id AS "productId",
        name AS "productName",
        stock_current AS "stockCurrent",
        stock_min AS "stockMin",
        unit
      FROM products
      WHERE stock_current <= stock_min
      ORDER BY stock_current ASC
    `);
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao carregar alertas de estoque.', details: error.message });
  }
});

app.post('/api/auth/register-customer', async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    serviceRequest,
  } = req.body;

  if (!name || !email || !phone || !password || !serviceRequest) {
    return res.status(400).json({ message: 'name, email, phone, password e serviceRequest são obrigatórios.' });
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  try {
    await pool.query('BEGIN');

    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email = $1 OR phone = $2 LIMIT 1`,
      [normalizedEmail, normalizedPhone],
    );

    if (existingUser.rows.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(409).json({ message: 'Já existe um usuário com esse e-mail ou telefone.' });
    }

    const passwordHash = await hashPassword(String(password));

    const createdUser = await pool.query(
      `INSERT INTO users(name, email, phone, password_hash, role, active)
       VALUES($1, $2, $3, $4, 'customer', TRUE)
       RETURNING id, name, email, phone, role`,
      [String(name).trim(), normalizedEmail, normalizedPhone, passwordHash],
    );

    await pool.query(
      `INSERT INTO service_requests(user_id, description)
       VALUES($1, $2)`,
      [createdUser.rows[0].id, String(serviceRequest).trim()],
    );

    await pool.query('COMMIT');

    return res.status(201).json(createdUser.rows[0]);
  } catch (error) {
    await pool.query('ROLLBACK');
    return res.status(500).json({ message: 'Erro ao cadastrar cliente.', details: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email e password são obrigatórios.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, phone, role, active, password_hash
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [normalizeEmail(email)],
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const user = rows[0];

    if (!user.active) {
      return res.status(403).json({ message: 'Usuário inativo.' });
    }

    const passwordMatches = user.password_hash
      ? await verifyPassword(String(password), user.password_hash)
      : false;

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao autenticar usuário.', details: error.message });
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
  const {
    name,
    email,
    phone,
    role,
    password,
    cpf,
    address,
    birthDate,
    emergencyContact,
    department,
    jobTitle,
  } = req.body;

  if (!name || !role) {
    return res.status(400).json({ message: 'name e role são obrigatórios.' });
  }

  if (!['admin', 'employee', 'customer'].includes(role)) {
    return res.status(400).json({ message: 'role inválido.' });
  }

  try {
    const normalizedUserEmail = normalizeEmail(email);
    const normalizedUserPhone = normalizePhone(phone);
    const passwordHash = password ? await hashPassword(String(password)) : null;

    const { rows } = await pool.query(
      `INSERT INTO users(name, email, phone, password_hash, role, cpf, address, birth_date, emergency_contact, department, job_title)
       VALUES($1, NULLIF($2, ''), NULLIF($3, ''), $4, $5, NULLIF($6, ''), NULLIF($7, ''), NULLIF($8, '')::DATE, NULLIF($9, ''), NULLIF($10, ''), NULLIF($11, ''))
       RETURNING id, name, email, phone, role, active, cpf, address, birth_date, emergency_contact, department, job_title, created_at, updated_at`,
      [
        String(name).trim(),
        normalizedUserEmail,
        normalizedUserPhone,
        passwordHash,
        role,
        String(cpf || '').replace(/\D/g, '').slice(0, 14),
        address || '',
        birthDate || '',
        emergencyContact || '',
        department || '',
        jobTitle || '',
      ],
    );
    return res.status(201).json(sanitizeUser(rows[0]));
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao criar usuário.', details: error.message });
  }
});


app.get('/api/users/:id/profile', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, phone, role, active, cpf, address, birth_date, emergency_contact, department, job_title, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [req.params.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.status(200).json(sanitizeUser(rows[0]));
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao carregar perfil.', details: error.message });
  }
});

app.put('/api/users/:id/profile', async (req, res) => {
  const { name, email, phone, cpf, address, birthDate, emergencyContact, department, jobTitle } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'name é obrigatório.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET name = $1,
           email = NULLIF($2, ''),
           phone = NULLIF($3, ''),
           cpf = NULLIF($4, ''),
           address = NULLIF($5, ''),
           birth_date = NULLIF($6, '')::DATE,
           emergency_contact = NULLIF($7, ''),
           department = NULLIF($8, ''),
           job_title = NULLIF($9, ''),
           updated_at = NOW()
      WHERE id = $10
      RETURNING id, name, email, phone, role, active, cpf, address, birth_date, emergency_contact, department, job_title, created_at, updated_at`,
      [
        String(name).trim(),
        normalizeEmail(email),
        normalizePhone(phone),
        String(cpf || '').replace(/\D/g, '').slice(0, 14),
        address || '',
        birthDate || '',
        emergencyContact || '',
        department || '',
        jobTitle || '',
        req.params.id,
      ],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.status(200).json(sanitizeUser(rows[0]));
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao atualizar perfil.', details: error.message });
  }
});

app.put('/api/users/:id/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'currentPassword e newPassword são obrigatórios.' });
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(String(newPassword))) {
    return res.status(400).json({
      message: 'A nova senha deve ter ao menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo.',
    });
  }

  try {
    const { rows } = await pool.query('SELECT id, password_hash FROM users WHERE id = $1 LIMIT 1', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const valid = rows[0].password_hash
      ? await verifyPassword(String(currentPassword), rows[0].password_hash)
      : false;

    if (!valid) {
      return res.status(401).json({ message: 'Senha atual inválida.' });
    }

    const nextHash = await hashPassword(String(newPassword));
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [nextHash, req.params.id]);

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao atualizar senha.', details: error.message });
  }
});

app.get('/api/services', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        s.id,
        s.name,
        s.hours,
        s.needs_scheduling,
        s.products,
        s.observation,
        s.price_rule,
        s.per_unit,
        s.active,
        s.average_time_minutes,
        s.created_at,
        s.updated_at,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'productId', sp.product_id,
            'quantity', sp.qty,
            'unit', sp.unit,
            'wasteFactor', sp.waste_factor,
            'productName', p.name,
            'productUnit', p.unit
          )) FILTER (WHERE sp.id IS NOT NULL),
          '[]'::json
        ) AS product_consumption,
        COALESCE(
          json_object_agg(pr.vehicle_type, json_build_object(
            'costP', pr.cost_p,
            'costM', pr.cost_m,
            'costG', pr.cost_g,
            'priceP', pr.price_p,
            'priceM', pr.price_m,
            'priceG', pr.price_g
          )) FILTER (WHERE pr.id IS NOT NULL),
          '{}'::json
        ) AS pricing,
        COALESCE(
          array_remove(array_agg(DISTINCT svt.vehicle_type), NULL),
          ARRAY['carro'::vehicle_type, 'moto'::vehicle_type, 'caminhao'::vehicle_type]
        ) AS vehicle_types
      FROM services s
      LEFT JOIN service_products sp ON sp.service_id = s.id
      LEFT JOIN products p ON p.id = sp.product_id
      LEFT JOIN service_pricing pr ON pr.service_id = s.id
      LEFT JOIN service_vehicle_types svt ON svt.service_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar serviços.', details: error.message });
  }
});

app.post('/api/services', async (req, res) => {
  const {
    name,
    hours = 1,
    needsScheduling = false,
    products = '',
    observation = '',
    priceRule = '',
    perUnit = false,
    active = true,
    averageTimeMinutes = 60,
    pricing = {},
    vehicleTypes = ['carro', 'moto', 'caminhao'],
    productConsumption = [],
  } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'name é obrigatório.' });
  }

  try {
    await pool.query('BEGIN');

    const { rows } = await pool.query(
      `INSERT INTO services(name, hours, needs_scheduling, products, observation, price_rule, per_unit, active, average_time_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, hours, needsScheduling, products, observation, priceRule, perUnit, active, averageTimeMinutes],
    );

    const service = rows[0];

    for (const type of vehicleTypes) {
      await pool.query(
        `INSERT INTO service_vehicle_types(service_id, vehicle_type)
         VALUES($1, $2)
         ON CONFLICT (service_id, vehicle_type) DO NOTHING`,
        [service.id, type],
      );

      const typePricing = pricing[type] || {};
      await pool.query(
        `INSERT INTO service_pricing(service_id, vehicle_type, cost_p, cost_m, cost_g, price_p, price_m, price_g)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (service_id, vehicle_type)
         DO UPDATE SET cost_p = EXCLUDED.cost_p, cost_m = EXCLUDED.cost_m, cost_g = EXCLUDED.cost_g,
           price_p = EXCLUDED.price_p, price_m = EXCLUDED.price_m, price_g = EXCLUDED.price_g`,
        [
          service.id,
          type,
          Number(typePricing.costP || 0),
          Number(typePricing.costM || 0),
          Number(typePricing.costG || 0),
          Number(typePricing.priceP || 0),
          Number(typePricing.priceM || 0),
          Number(typePricing.priceG || 0),
        ],
      );
    }

    for (const consumption of productConsumption) {
      await pool.query(
        `INSERT INTO service_products(service_id, product_id, qty, unit, waste_factor)
         VALUES($1, $2, $3, $4, $5)
         ON CONFLICT(service_id, product_id)
         DO UPDATE SET qty = EXCLUDED.qty, unit = EXCLUDED.unit, waste_factor = EXCLUDED.waste_factor`,
        [
          service.id,
          consumption.productId,
          Number(consumption.quantity),
          consumption.unit,
          Number(consumption.wasteFactor || 0),
        ],
      );
    }

    await pool.query('COMMIT');
    return res.status(201).json(service);
  } catch (error) {
    await pool.query('ROLLBACK');
    return res.status(500).json({ message: 'Erro ao criar serviço.', details: error.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    hours = 1,
    needsScheduling = false,
    products = '',
    observation = '',
    priceRule = '',
    perUnit = false,
    active = true,
    averageTimeMinutes = 60,
    pricing = {},
    vehicleTypes = ['carro', 'moto', 'caminhao'],
    productConsumption = [],
  } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'name é obrigatório.' });
  }

  try {
    await pool.query('BEGIN');

    const { rows } = await pool.query(
      `UPDATE services
       SET name = $1,
           hours = $2,
           needs_scheduling = $3,
           products = $4,
           observation = $5,
           price_rule = $6,
           per_unit = $7,
           active = $8,
           average_time_minutes = $9,
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [name, hours, needsScheduling, products, observation, priceRule, perUnit, active, averageTimeMinutes, id],
    );

    if (rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Serviço não encontrado.' });
    }

    await pool.query('DELETE FROM service_vehicle_types WHERE service_id = $1', [id]);
    await pool.query('DELETE FROM service_products WHERE service_id = $1', [id]);

    for (const type of vehicleTypes) {
      await pool.query(
        `INSERT INTO service_vehicle_types(service_id, vehicle_type)
         VALUES($1, $2)
         ON CONFLICT (service_id, vehicle_type) DO NOTHING`,
        [id, type],
      );

      const typePricing = pricing[type] || {};
      await pool.query(
        `INSERT INTO service_pricing(service_id, vehicle_type, cost_p, cost_m, cost_g, price_p, price_m, price_g)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (service_id, vehicle_type)
         DO UPDATE SET cost_p = EXCLUDED.cost_p, cost_m = EXCLUDED.cost_m, cost_g = EXCLUDED.cost_g,
           price_p = EXCLUDED.price_p, price_m = EXCLUDED.price_m, price_g = EXCLUDED.price_g`,
        [
          id,
          type,
          Number(typePricing.costP || 0),
          Number(typePricing.costM || 0),
          Number(typePricing.costG || 0),
          Number(typePricing.priceP || 0),
          Number(typePricing.priceM || 0),
          Number(typePricing.priceG || 0),
        ],
      );
    }

    for (const consumption of productConsumption) {
      await pool.query(
        `INSERT INTO service_products(service_id, product_id, qty, unit, waste_factor)
         VALUES($1, $2, $3, $4, $5)
         ON CONFLICT(service_id, product_id)
         DO UPDATE SET qty = EXCLUDED.qty, unit = EXCLUDED.unit, waste_factor = EXCLUDED.waste_factor`,
        [id, consumption.productId, Number(consumption.quantity), consumption.unit, Number(consumption.wasteFactor || 0)],
      );
    }

    await pool.query('COMMIT');

    return res.status(200).json(rows[0]);
  } catch (error) {
    await pool.query('ROLLBACK');
    return res.status(500).json({ message: 'Erro ao atualizar serviço.', details: error.message });
  }
});

app.post('/api/work-order-items/:id/complete', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('BEGIN');

    const { rows } = await pool.query('SELECT id, status FROM order_items WHERE id = $1 FOR UPDATE', [id]);
    if (rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Item de OS não encontrado.' });
    }

    if (rows[0].status === 'done') {
      await pool.query('ROLLBACK');
      return res.status(200).json({ ok: true });
    }

    await pool.query('SELECT consume_stock_on_done($1)', [id]);

    await pool.query(
      `UPDATE order_items
       SET status = 'done', done_at = NOW()
       WHERE id = $1`,
      [id],
    );

    await pool.query('COMMIT');
    return res.status(200).json({ ok: true });
  } catch (error) {
    await pool.query('ROLLBACK');
    return res.status(422).json({ message: 'Falha ao concluir item de OS.', details: error.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query('DELETE FROM services WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Serviço não encontrado.' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao remover serviço.', details: error.message });
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

    if (rows.length === 0) {
      return res.status(200).json({ found: false, openOrder: false });
    }

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

const bootstrap = async () => {
  try {
    await ensureCoreAuthTables();
    await runBusinessBootstrap();
    await ensureInventoryFeature();
    app.listen(port, '0.0.0.0', () => {
      console.log(`AryCar API on http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error('[arycar-api] failed to start', error);
    process.exit(1);
  }
};

bootstrap();
