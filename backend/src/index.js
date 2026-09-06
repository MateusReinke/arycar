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

const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.AUTH_TOKEN_SECRET) {
  console.warn(
    '[arycar-api] AUTH_TOKEN_SECRET não definido: usando um segredo gerado neste boot. ' +
    'Defina AUTH_TOKEN_SECRET no ambiente para que as sessões continuem válidas entre reinícios do servidor.',
  );
}
const AUTH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const seedVehicleTypes = ['carro', 'moto', 'caminhao'];
const motoFactor = 0.7;
const truckFactor = 1.35;

const buildPricingFromCar = (carPricing) => ({
  carro: { ...carPricing },
  moto: {
    costP: Math.round(carPricing.costP * motoFactor),
    costM: Math.round(carPricing.costM * motoFactor),
    costG: Math.round(carPricing.costG * motoFactor),
    priceP: Math.round(carPricing.priceP * motoFactor),
    priceM: Math.round(carPricing.priceM * motoFactor),
    priceG: Math.round(carPricing.priceG * motoFactor),
  },
  caminhao: {
    costP: Math.round(carPricing.costP * truckFactor),
    costM: Math.round(carPricing.costM * truckFactor),
    costG: Math.round(carPricing.costG * truckFactor),
    priceP: Math.round(carPricing.priceP * truckFactor),
    priceM: Math.round(carPricing.priceM * truckFactor),
    priceG: Math.round(carPricing.priceG * truckFactor),
  },
});

const serviceSeeds = [
  { name: 'Lavagem Simples', pricing: buildPricingFromCar({ costP: 20, costM: 25, costG: 30, priceP: 40, priceM: 50, priceG: 60 }), hours: 1, needsScheduling: false, products: 'Shampoo Neutro, Agua, Pretinho, eco-diesel, multi-uso, limpa-Bau', observation: '', priceRule: '' },
  { name: 'Lavagem Detalhada', pricing: buildPricingFromCar({ costP: 30, costM: 50, costG: 70, priceP: 80, priceM: 100, priceG: 120 }), hours: 2, needsScheduling: false, products: 'Shampoo Neutro, Agua, Pretinho, eco-diesel, multi-uso, limpa-Bau, Cera', observation: '', priceRule: '' },
  { name: 'Lavagem de motor - Parcial', pricing: buildPricingFromCar({ costP: 90, costM: 110, costG: 130, priceP: 180, priceM: 220, priceG: 260 }), hours: 2, needsScheduling: false, products: 'Shampoo Neutro, Agua, Pretinho, eco-diesel, multi-uso, limpa-Bau, desengraxante, verniz de motor', observation: '', priceRule: '' },
  { name: 'Lavagem de motor - Completo', pricing: buildPricingFromCar({ costP: 180, costM: 220, costG: 260, priceP: 250, priceM: 300, priceG: 350 }), hours: 3, needsScheduling: false, products: 'Shampoo Neutro, Agua, Pretinho, eco-diesel, multi-uso, limpa-Bau, desengraxante, verniz de motor', observation: '', priceRule: '' },
  { name: 'Lavagem de Chassi', pricing: buildPricingFromCar({ costP: 180, costM: 220, costG: 260, priceP: 250, priceM: 300, priceG: 350 }), hours: 3, needsScheduling: false, products: 'Shampoo Neutro, Agua, Pretinho, eco-diesel, multi-uso, limpa-Bau, desengraxante, verniz de Chassi', observation: '', priceRule: '' },
  { name: 'Lavagem Caixa de Roda', pricing: buildPricingFromCar({ costP: 80, costM: 100, costG: 120, priceP: 160, priceM: 200, priceG: 240 }), hours: 2, needsScheduling: false, products: 'Shampoo Neutro, Agua, Pretinho, eco-diesel, multi-uso, limpa-Bau, Cera, desengraxante, verniz de Caixa de roda', observation: '', priceRule: '' },
  { name: 'Remoção de Chuva Ácida', pricing: buildPricingFromCar({ costP: 110, costM: 130, costG: 150, priceP: 220, priceM: 260, priceG: 300 }), hours: 2, needsScheduling: false, products: 'Shampoo Neutro, Agua, Pretinho, eco-diesel, multi-uso, limpa-Bau, Prisma, Focus', observation: '', priceRule: '' },
  { name: 'Cristalização de vidros', pricing: buildPricingFromCar({ costP: 0, costM: 0, costG: 0, priceP: 0, priceM: 0, priceG: 0 }), hours: 5, needsScheduling: true, products: 'Hydrox Fast - Vonixx', observation: '', priceRule: '+50% Remoção Chuva' },
  { name: 'Polimento comercial', pricing: buildPricingFromCar({ costP: 125, costM: 175, costG: 225, priceP: 250, priceM: 350, priceG: 450 }), hours: 5, needsScheduling: true, products: 'Massa de polir, lustrador, cera', observation: '', priceRule: '' },
  { name: 'Polimento Técnico', pricing: buildPricingFromCar({ costP: 225, costM: 310, costG: 405, priceP: 450, priceM: 620, priceG: 810 }), hours: 8, needsScheduling: true, products: 'Lixa, massa de polir, lustrador, cera', observation: '', priceRule: '' },
  { name: 'Vitrificação de pintura', pricing: buildPricingFromCar({ costP: 35, costM: 35, costG: 35, priceP: 120, priceM: 150, priceG: 200 }), hours: 3, needsScheduling: true, products: 'V-paint - Vonixx', observation: 'Somar com o Polimento escolhido (exceto veículos já prontos para vitrificar).', priceRule: '' },
  { name: 'Clareamento de Faróis', pricing: buildPricingFromCar({ costP: 25, costM: 25, costG: 25, priceP: 180, priceM: 200, priceG: 220 }), hours: 2, needsScheduling: true, products: 'Lixa, massa de polir, lustrador, cera', observation: '', priceRule: '' },
  { name: 'Vitrificação de faróis', pricing: buildPricingFromCar({ costP: 17, costM: 17, costG: 17, priceP: 50, priceM: 75, priceG: 100 }), hours: 1, needsScheduling: true, products: 'V-light - Vonixx', observation: 'Somar com o Clareamento de Farol, se necessário.', priceRule: '' },
  { name: 'Vitrificação de Plásticos', pricing: buildPricingFromCar({ costP: 60, costM: 60, costG: 60, priceP: 120, priceM: 180, priceG: 250 }), hours: 3, needsScheduling: true, products: 'V-PLASTIC PRO - Vonixx', observation: '', priceRule: '' },
  { name: 'Vitrificação de Couro', pricing: buildPricingFromCar({ costP: 60, costM: 60, costG: 60, priceP: 120, priceM: 180, priceG: 250 }), hours: 3, needsScheduling: true, products: 'V-LEATHER PRO - Vonixx', observation: '', priceRule: '' },
  { name: 'Higienização', pricing: buildPricingFromCar({ costP: 100, costM: 100, costG: 100, priceP: 200, priceM: 250, priceG: 300 }), hours: 3, needsScheduling: true, products: 'Multi-uso, Sintra, Higicouro, Hidracouro', observation: '', priceRule: '' },
  { name: 'Oxi sanitização', pricing: buildPricingFromCar({ costP: 20, costM: 20, costG: 20, priceP: 50, priceM: 80, priceG: 100 }), hours: 1, needsScheduling: true, products: 'Ozônio', observation: '', priceRule: '' },
  { name: 'Descontaminação de pintura', pricing: buildPricingFromCar({ costP: 60, costM: 60, costG: 60, priceP: 150, priceM: 200, priceG: 250 }), hours: 2, needsScheduling: true, products: 'Barra descontaminante (Clay Bar)', observation: '', priceRule: '' },
  { name: 'Martelinho de ouro', pricing: buildPricingFromCar({ costP: 100, costM: 150, costG: 200, priceP: 150, priceM: 200, priceG: 250 }), hours: 4, needsScheduling: true, products: '-', observation: '', priceRule: '' },
  { name: 'Envelopamento', pricing: buildPricingFromCar({ costP: 350, costM: 400, costG: 450, priceP: 400, priceM: 450, priceG: 500 }), hours: 5, needsScheduling: true, products: '-', observation: '', priceRule: '' },
  { name: 'Pequenos reparos express', pricing: buildPricingFromCar({ costP: 105, costM: 135, costG: 155, priceP: 350, priceM: 450, priceG: 550 }), hours: 5, needsScheduling: true, products: 'Tinta, verniz, SpectraPrime, massa poliéster, lixa, massa de polir, lustrador, cera', observation: '', priceRule: '' },
];


const hashPassword = async (plainTextPassword) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(plainTextPassword), salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = async (plainTextPassword, storedPasswordHash) => {
  if (!storedPasswordHash || !storedPasswordHash.includes(':')) return false;
  const [salt, savedHash] = String(storedPasswordHash).split(':');
  const derived = crypto.scryptSync(String(plainTextPassword), salt, 64).toString('hex');
  const savedBuffer = Buffer.from(savedHash, 'hex');
  const derivedBuffer = Buffer.from(derived, 'hex');
  return savedBuffer.length === derivedBuffer.length && crypto.timingSafeEqual(savedBuffer, derivedBuffer);
};

// Minimal signed session token (HMAC-SHA256), avoids pulling in a JWT dependency
// for a single-secret, single-server bearer token.
const signAuthToken = (payload) => {
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + AUTH_TOKEN_TTL_SECONDS })).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
};

const verifyAuthToken = (token) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;

  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expectedSignature = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(body).digest('base64url');
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
};

// Requires a valid bearer token; attaches { id, role } to req.user.
const authenticate = (req, res, next) => {
  const [scheme, token] = String(req.headers.authorization || '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Autenticação necessária.' });
  }

  const payload = verifyAuthToken(token);
  if (!payload || !payload.sub || !payload.role) {
    return res.status(401).json({ message: 'Sessão inválida ou expirada. Faça login novamente.' });
  }

  req.user = { id: payload.sub, role: payload.role };
  return next();
};

// Must run after `authenticate`. Allows only the given roles.
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Você não tem permissão para acessar este recurso.' });
  }
  return next();
};

// Must run after `authenticate`. Allows the user themself (matching :id) or the given roles.
const requireSelfOrRole = (...roles) => (req, res, next) => {
  if (req.user && (req.user.id === req.params.id || roles.includes(req.user.role))) {
    return next();
  }
  return res.status(403).json({ message: 'Você não tem permissão para acessar este recurso.' });
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
      vehicle_type VARCHAR(50) NOT NULL,
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
      vehicle_type VARCHAR(50) NOT NULL,
      PRIMARY KEY (service_id, vehicle_type)
    )
  `);

  await pool.query(`
    ALTER TABLE service_pricing
    ALTER COLUMN vehicle_type TYPE VARCHAR(50)
    USING vehicle_type::text
  `);

  await pool.query(`
    ALTER TABLE service_vehicle_types
    ALTER COLUMN vehicle_type TYPE VARCHAR(50)
    USING vehicle_type::text
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
      product_type VARCHAR(80) NOT NULL DEFAULT 'Insumo',
      brand VARCHAR(120) NOT NULL DEFAULT 'Genérica',
      name VARCHAR(200) NOT NULL UNIQUE,
      unit unit_enum NOT NULL,
      stock_current NUMERIC(14,3) NOT NULL DEFAULT 0,
      stock_min NUMERIC(14,3) NOT NULL DEFAULT 0,
      price_per_liter NUMERIC(14,2) NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(80) NOT NULL DEFAULT 'Insumo'`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(120) NOT NULL DEFAULT 'Genérica'`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS price_per_liter NUMERIC(14,2) NOT NULL DEFAULT 0`);

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
    INSERT INTO products (product_type, brand, name, unit, stock_current, stock_min, price_per_liter)
    VALUES
      ('Shampoo', 'Vonixx', 'V-Floc', 'l', 22, 6, 65),
      ('Shampoo', 'Vonixx', 'V-Mol', 'l', 18, 5, 72),
      ('Cera', 'Vonixx', 'Blend Spray Wax', 'l', 10, 3, 120),
      ('Desengraxante', 'Vonixx', 'Sintra Fast', 'l', 15, 4, 85),
      ('Multi-uso', 'Vonixx', 'APC', 'l', 14, 4, 58),
      ('Verniz de Motor', 'Vonixx', 'Motor Shine', 'l', 8, 2, 95),
      ('Limpa-baú', 'Start', 'Truck Cleaner', 'l', 12, 3, 44),
      ('Pretinho', 'Vonixx', 'Restaurax', 'l', 9, 2, 110)
    ON CONFLICT (name) DO UPDATE
    SET product_type = EXCLUDED.product_type,
        brand = EXCLUDED.brand,
        unit = EXCLUDED.unit,
        stock_current = EXCLUDED.stock_current,
        stock_min = EXCLUDED.stock_min,
        price_per_liter = EXCLUDED.price_per_liter,
        updated_at = NOW()
  `);
};

const ensureServiceSeeds = async () => {
  const { rows } = await pool.query('SELECT COUNT(*)::INTEGER AS total FROM services');
  if ((rows[0]?.total || 0) > 0) return;

  for (const service of serviceSeeds) {
    const inserted = await pool.query(
      `INSERT INTO services(name, hours, needs_scheduling, products, observation, price_rule, per_unit, active, average_time_minutes)
       VALUES($1, $2, $3, $4, $5, $6, FALSE, TRUE, $7)
       RETURNING id`,
      [service.name, service.hours, service.needsScheduling, service.products, service.observation, service.priceRule, Math.max(30, Number(service.hours) * 60)],
    );

    const serviceId = inserted.rows[0].id;

    for (const vehicleType of seedVehicleTypes) {
      await pool.query(
        `INSERT INTO service_vehicle_types(service_id, vehicle_type)
         VALUES($1, $2)
         ON CONFLICT (service_id, vehicle_type) DO NOTHING`,
        [serviceId, vehicleType],
      );

      const pricing = service.pricing[vehicleType];
      await pool.query(
        `INSERT INTO service_pricing(service_id, vehicle_type, cost_p, cost_m, cost_g, price_p, price_m, price_g)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (service_id, vehicle_type)
         DO UPDATE SET cost_p = EXCLUDED.cost_p, cost_m = EXCLUDED.cost_m, cost_g = EXCLUDED.cost_g,
           price_p = EXCLUDED.price_p, price_m = EXCLUDED.price_m, price_g = EXCLUDED.price_g`,
        [serviceId, vehicleType, pricing.costP, pricing.costM, pricing.costG, pricing.priceP, pricing.priceM, pricing.priceG],
      );
    }
  }
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

app.get('/api/products', authenticate, requireRole('admin'), async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id, p.product_type AS "productType", p.brand, p.name, p.unit,
        p.stock_current AS "stockCurrent", p.stock_min AS "stockMin",
        p.price_per_liter AS "pricePerLiter", p.active,
        COUNT(DISTINCT sp.service_id)::INTEGER AS "usedInServices"
      FROM products p
      LEFT JOIN service_products sp ON sp.product_id = p.id
      GROUP BY p.id
      ORDER BY p.name ASC
    `);
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar produtos.', details: error.message });
  }
});

app.post('/api/products', authenticate, requireRole('admin'), async (req, res) => {
  const {
    productType = 'Insumo',
    brand = 'Genérica',
    name,
    unit = 'l',
    stockCurrent = 0,
    stockMin = 0,
    pricePerLiter = 0,
    active = true,
  } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Nome do produto é obrigatório.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO products (product_type, brand, name, unit, stock_current, stock_min, price_per_liter, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, product_type AS "productType", brand, name, unit,
         stock_current AS "stockCurrent", stock_min AS "stockMin", price_per_liter AS "pricePerLiter", active`,
      [
        String(productType).trim(),
        String(brand).trim(),
        String(name).trim(),
        unit,
        Number(stockCurrent),
        Number(stockMin),
        Number(pricePerLiter),
        Boolean(active),
      ],
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao criar produto.', details: error.message });
  }
});

app.put('/api/products/:id', authenticate, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const {
    productType = 'Insumo',
    brand = 'Genérica',
    name,
    unit = 'l',
    stockCurrent = 0,
    stockMin = 0,
    pricePerLiter = 0,
    active = true,
  } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Nome do produto é obrigatório.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE products
       SET product_type = $1,
           brand = $2,
           name = $3,
           unit = $4,
           stock_current = $5,
           stock_min = $6,
           price_per_liter = $7,
           active = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING id, product_type AS "productType", brand, name, unit,
         stock_current AS "stockCurrent", stock_min AS "stockMin", price_per_liter AS "pricePerLiter", active`,
      [
        String(productType).trim(),
        String(brand).trim(),
        String(name).trim(),
        unit,
        Number(stockCurrent),
        Number(stockMin),
        Number(pricePerLiter),
        Boolean(active),
        id,
      ],
    );

    if (!rows[0]) return res.status(404).json({ message: 'Produto não encontrado.' });
    return res.status(200).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao atualizar produto.', details: error.message });
  }
});

app.delete('/api/products/:id', authenticate, requireRole('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const inUse = await pool.query('SELECT 1 FROM service_products WHERE product_id = $1 LIMIT 1', [id]);
    if (inUse.rows.length > 0) {
      return res.status(409).json({ message: 'Produto em uso em serviços e não pode ser excluído.' });
    }

    const result = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Produto não encontrado.' });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao remover produto.', details: error.message });
  }
});

app.post('/api/products/:id/stock-entries', authenticate, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const delta = Number(req.body?.delta);
  const reason = String(req.body?.reason || '').trim();

  if (!Number.isFinite(delta) || delta === 0) {
    return res.status(400).json({ message: 'Informe uma quantidade diferente de zero.' });
  }

  try {
    await pool.query('BEGIN');

    const { rows: productRows } = await pool.query(
      'SELECT id, name, unit, stock_current FROM products WHERE id = $1 FOR UPDATE',
      [id],
    );

    if (productRows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    const product = productRows[0];
    const beforeQty = Number(product.stock_current);
    const afterQty = beforeQty + delta;

    if (afterQty < 0) {
      await pool.query('ROLLBACK');
      return res.status(422).json({
        message: `Estoque insuficiente para ${product.name} (atual: ${beforeQty}, saída: ${Math.abs(delta)}).`,
      });
    }

    await pool.query(
      'UPDATE products SET stock_current = $1, updated_at = NOW() WHERE id = $2',
      [afterQty, id],
    );

    const { rows: movementRows } = await pool.query(
      `INSERT INTO stock_movements (product_id, movement_type, qty, unit, stock_before, stock_after, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, product_id AS "productId", movement_type AS "movementType", qty, unit,
         stock_before AS "stockBefore", stock_after AS "stockAfter", details, created_at AS "createdAt"`,
      [
        id,
        delta > 0 ? 'manual_in' : 'manual_out',
        Math.abs(delta),
        product.unit,
        beforeQty,
        afterQty,
        JSON.stringify({ reason: reason || null }),
      ],
    );

    await pool.query('COMMIT');
    return res.status(201).json({ ...movementRows[0], productName: product.name, stockCurrent: afterQty });
  } catch (error) {
    await pool.query('ROLLBACK');
    return res.status(500).json({ message: 'Erro ao registrar movimentação de estoque.', details: error.message });
  }
});

app.get('/api/stock/movements', authenticate, requireRole('admin'), async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 200);

  try {
    const { rows } = await pool.query(
      `SELECT
        sm.id,
        sm.product_id AS "productId",
        CONCAT(p.product_type, ' - ', p.brand, ' - ', p.name) AS "productName",
        sm.movement_type AS "movementType",
        sm.qty,
        sm.unit,
        sm.stock_before AS "stockBefore",
        sm.stock_after AS "stockAfter",
        sm.details,
        sm.created_at AS "createdAt"
      FROM stock_movements sm
      INNER JOIN products p ON p.id = sm.product_id
      ORDER BY sm.created_at DESC
      LIMIT $1`,
      [limit],
    );
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar movimentações de estoque.', details: error.message });
  }
});

app.get('/api/stock/alerts', authenticate, requireRole('admin'), async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id AS "productId",
        CONCAT(product_type, ' - ', brand, ' - ', name) AS "productName",
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingUser = await client.query(
      `SELECT id FROM users WHERE email = $1 OR phone = $2 LIMIT 1`,
      [normalizedEmail, normalizedPhone],
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Já existe um usuário com esse e-mail ou telefone.' });
    }

    const passwordHash = await hashPassword(String(password));

    const createdUser = await client.query(
      `INSERT INTO users(name, email, phone, password_hash, role, active)
       VALUES($1, $2, $3, $4, 'customer', TRUE)
       RETURNING id, name, email, phone, role`,
      [String(name).trim(), normalizedEmail, normalizedPhone, passwordHash],
    );

    await client.query(
      `INSERT INTO service_requests(user_id, description)
       VALUES($1, $2)`,
      [createdUser.rows[0].id, String(serviceRequest).trim()],
    );

    await client.query('COMMIT');

    const createdRow = createdUser.rows[0];
    return res.status(201).json({ ...createdRow, token: signAuthToken({ sub: createdRow.id, role: createdRow.role }) });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ message: 'Erro ao cadastrar cliente.', details: error.message });
  } finally {
    client.release();
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
      token: signAuthToken({ sub: user.id, role: user.role }),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao autenticar usuário.', details: error.message });
  }
});

app.get('/api/users', authenticate, requireRole('admin'), async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, phone, role, active, created_at FROM users ORDER BY created_at DESC');
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar usuários.', details: error.message });
  }
});

app.post('/api/users', authenticate, requireRole('admin'), async (req, res) => {
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


app.get('/api/users/:id/profile', authenticate, requireSelfOrRole('admin'), async (req, res) => {
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

app.put('/api/users/:id/profile', authenticate, requireSelfOrRole('admin'), async (req, res) => {
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

app.put('/api/users/:id/password', authenticate, requireSelfOrRole('admin'), async (req, res) => {
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

const SERVICE_SELECT_COLUMNS = `
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
    ARRAY['carro', 'moto', 'caminhao']::text[]
  ) AS vehicle_types
`;

const SERVICE_SELECT_FROM = `
  FROM services s
  LEFT JOIN service_products sp ON sp.service_id = s.id
  LEFT JOIN products p ON p.id = sp.product_id
  LEFT JOIN service_pricing pr ON pr.service_id = s.id
  LEFT JOIN service_vehicle_types svt ON svt.service_id = s.id
`;

const fetchServiceById = async (client, id) => {
  const { rows } = await client.query(
    `SELECT ${SERVICE_SELECT_COLUMNS} ${SERVICE_SELECT_FROM} WHERE s.id = $1 GROUP BY s.id`,
    [id],
  );
  return rows[0] || null;
};

app.get('/api/services', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT ${SERVICE_SELECT_COLUMNS}
      ${SERVICE_SELECT_FROM}
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar serviços.', details: error.message });
  }
});

app.post('/api/services', authenticate, requireRole('admin'), async (req, res) => {
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO services(name, hours, needs_scheduling, products, observation, price_rule, per_unit, active, average_time_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, hours, needsScheduling, products, observation, priceRule, perUnit, active, averageTimeMinutes],
    );

    const service = rows[0];

    const normalizedVehicleTypes = Array.from(new Set((Array.isArray(vehicleTypes) ? vehicleTypes : [])
      .map((type) => String(type || '').trim().toLowerCase())
      .filter(Boolean)));

    const safeVehicleTypes = normalizedVehicleTypes.length > 0
      ? normalizedVehicleTypes
      : ['carro', 'moto', 'caminhao'];

    for (const type of safeVehicleTypes) {
      await client.query(
        `INSERT INTO service_vehicle_types(service_id, vehicle_type)
         VALUES($1, $2)
         ON CONFLICT (service_id, vehicle_type) DO NOTHING`,
        [service.id, type],
      );

      const typePricing = pricing[type] || {};
      await client.query(
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
      await client.query(
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

    const fullService = await fetchServiceById(client, service.id);

    await client.query('COMMIT');
    return res.status(201).json(fullService);
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ message: 'Erro ao criar serviço.', details: error.message });
  } finally {
    client.release();
  }
});

app.put('/api/services/:id', authenticate, requireRole('admin'), async (req, res) => {
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
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
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Serviço não encontrado.' });
    }

    await client.query('DELETE FROM service_vehicle_types WHERE service_id = $1', [id]);
    await client.query('DELETE FROM service_pricing WHERE service_id = $1', [id]);
    await client.query('DELETE FROM service_products WHERE service_id = $1', [id]);

    const normalizedVehicleTypes = Array.from(new Set((Array.isArray(vehicleTypes) ? vehicleTypes : [])
      .map((type) => String(type || '').trim().toLowerCase())
      .filter(Boolean)));

    const safeVehicleTypes = normalizedVehicleTypes.length > 0
      ? normalizedVehicleTypes
      : ['carro', 'moto', 'caminhao'];

    for (const type of safeVehicleTypes) {
      await client.query(
        `INSERT INTO service_vehicle_types(service_id, vehicle_type)
         VALUES($1, $2)
         ON CONFLICT (service_id, vehicle_type) DO NOTHING`,
        [id, type],
      );

      const typePricing = pricing[type] || {};
      await client.query(
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
      await client.query(
        `INSERT INTO service_products(service_id, product_id, qty, unit, waste_factor)
         VALUES($1, $2, $3, $4, $5)
         ON CONFLICT(service_id, product_id)
         DO UPDATE SET qty = EXCLUDED.qty, unit = EXCLUDED.unit, waste_factor = EXCLUDED.waste_factor`,
        [id, consumption.productId, Number(consumption.quantity), consumption.unit, Number(consumption.wasteFactor || 0)],
      );
    }

    const fullService = await fetchServiceById(client, id);

    await client.query('COMMIT');

    return res.status(200).json(fullService);
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ message: 'Erro ao atualizar serviço.', details: error.message });
  } finally {
    client.release();
  }
});

app.post('/api/work-order-items/:id/complete', authenticate, requireRole('admin', 'employee'), async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query('SELECT id, status FROM order_items WHERE id = $1 FOR UPDATE', [id]);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Item de OS não encontrado.' });
    }

    if (rows[0].status === 'done') {
      await client.query('ROLLBACK');
      return res.status(200).json({ ok: true });
    }

    await client.query('SELECT consume_stock_on_done($1)', [id]);

    await client.query(
      `UPDATE order_items
       SET status = 'done', done_at = NOW()
       WHERE id = $1`,
      [id],
    );

    await client.query('COMMIT');
    return res.status(200).json({ ok: true });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(422).json({ message: 'Falha ao concluir item de OS.', details: error.message });
  } finally {
    client.release();
  }
});

app.delete('/api/services/:id', authenticate, requireRole('admin'), async (req, res) => {
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

app.get('/api/order-statuses', authenticate, requireRole('admin'), async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, code, label, color_class, created_at FROM order_statuses ORDER BY created_at ASC');
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao listar status.', details: error.message });
  }
});

app.post('/api/order-statuses', authenticate, requireRole('admin'), async (req, res) => {
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

app.get('/api/orders/open-by-plate/:plate', authenticate, requireRole('admin', 'employee'), async (req, res) => {
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
    await ensureBusinessTables();
    await ensureInventoryFeature();
    await ensureServiceSeeds();
    app.listen(port, '0.0.0.0', () => {
      console.log(`AryCar API on http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error('[arycar-api] failed to start', error);
    process.exit(1);
  }
};

bootstrap();
