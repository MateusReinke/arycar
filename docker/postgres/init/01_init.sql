-- ARYCAR bootstrap schema
-- Este script roda automaticamente na primeira inicialização do container PostgreSQL.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  hours DECIMAL(4,1) NOT NULL DEFAULT 1,
  needs_scheduling BOOLEAN DEFAULT FALSE,
  products TEXT,
  observation TEXT,
  price_rule TEXT,
  per_unit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  cost_p DECIMAL(10,2) DEFAULT 0,
  cost_m DECIMAL(10,2) DEFAULT 0,
  cost_g DECIMAL(10,2) DEFAULT 0,
  price_p DECIMAL(10,2) DEFAULT 0,
  price_m DECIMAL(10,2) DEFAULT 0,
  price_g DECIMAL(10,2) DEFAULT 0,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  vehicle_type vehicle_type NOT NULL,
  vehicle_size vehicle_size NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  pickup_delivery BOOLEAN DEFAULT FALSE,
  description TEXT,
  technical_notes TEXT,
  status VARCHAR(20) DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  service_name VARCHAR(200) NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT
);

INSERT INTO settings (key, value)
VALUES ('whatsapp_number', '')
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_customers_cpf ON customers(cpf);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_vehicle ON orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
