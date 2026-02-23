-- ARYCAR bootstrap schema
-- Este script roda automaticamente na primeira inicialização do container PostgreSQL.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_type') THEN
    CREATE TYPE vehicle_type AS ENUM ('carro', 'moto', 'caminhao');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_size') THEN
    CREATE TYPE vehicle_size AS ENUM ('P', 'M', 'G');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  cpf VARCHAR(11) UNIQUE NOT NULL,
  phone VARCHAR(11),
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
);

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
);

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
);

CREATE TABLE IF NOT EXISTS service_vehicle_types (
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  PRIMARY KEY (service_id, vehicle_type)
);

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  role VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
);

CREATE TABLE IF NOT EXISTS policy_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS policy_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO policy_rules (code, title, description)
VALUES
  ('password_min_length', 'Senha mínima de 8 caracteres', 'Regra base de proteção para credenciais.'),
  ('password_complexity', 'Senha com letras maiúsculas, minúsculas, número e símbolo', 'Aumenta a segurança contra ataques de força bruta.'),
  ('mandatory_password_rotation', 'Troca de senha para contas compartilhadas', 'Recomendado para usuários administrativos.')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS order_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  color_class VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  service_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  unit_cost NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT
);

INSERT INTO users (name, email, password_hash, role)
VALUES ('Administrador', 'admin@arycar.com', crypt('Admin@123', gen_salt('bf')), 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO policy_rules (code, title, description)
VALUES
  ('password_min_length', 'Senha mínima de 8 caracteres', 'Regra base de proteção para credenciais.'),
  ('password_complexity', 'Senha com letras maiúsculas, minúsculas, número e símbolo', 'Aumenta a segurança contra ataques de força bruta.'),
  ('mandatory_password_rotation', 'Troca de senha para contas compartilhadas', 'Recomendado para usuários administrativos.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO order_statuses (code, label, color_class)
VALUES
  ('waiting', 'Aguardando', 'bg-yellow-500/10 border-yellow-500/40'),
  ('in_progress', 'Em Andamento', 'bg-blue-500/10 border-blue-500/40'),
  ('done', 'Finalizado', 'bg-green-500/10 border-green-500/40'),
  ('delivered', 'Entregue', 'bg-muted border-border')
ON CONFLICT (code) DO NOTHING;

INSERT INTO settings (key, value)
VALUES ('whatsapp_number', '')
ON CONFLICT (key) DO NOTHING;


CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash TEXT,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'employee', 'customer')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  color_class VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO users (name, email, password_hash, role)
VALUES ('Administrador', 'admin@arycar.com', crypt('Admin@123', gen_salt('bf')), 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO order_statuses (code, label, color_class)
VALUES
  ('waiting', 'Aguardando', 'bg-yellow-500/10 border-yellow-500/40'),
  ('in_progress', 'Em Andamento', 'bg-blue-500/10 border-blue-500/40'),
  ('done', 'Finalizado', 'bg-green-500/10 border-green-500/40'),
  ('delivered', 'Entregue', 'bg-muted border-border')
ON CONFLICT (code) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_customers_cpf ON customers(cpf);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_vehicle ON orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_order_per_vehicle
  ON orders(vehicle_id)
  WHERE status IN ('waiting', 'in_progress');
