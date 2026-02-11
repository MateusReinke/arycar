# 🗄️ ARYCAR - Schema PostgreSQL

Este documento descreve a estrutura de banco de dados necessária para migrar o sistema ARYCAR de LocalStorage para PostgreSQL.

---

## Diagrama ER

```
customers 1──N vehicles
customers 1──N orders
vehicles  1──N orders
services  N──N service_vehicle_types
services  1──N order_items
orders    1──N order_items
```

---

## DDL - Criação das Tabelas

```sql
-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- CLIENTES
-- =====================
CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(200) NOT NULL,
  cpf         VARCHAR(11) UNIQUE NOT NULL,
  phone       VARCHAR(11),
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_cpf ON customers(cpf);

-- =====================
-- VEÍCULOS
-- =====================
CREATE TYPE vehicle_type AS ENUM ('carro', 'moto', 'caminhao');
CREATE TYPE vehicle_size AS ENUM ('P', 'M', 'G');

CREATE TABLE vehicles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate       VARCHAR(7) UNIQUE NOT NULL,
  type        vehicle_type NOT NULL,
  size        vehicle_size NOT NULL,
  brand       VARCHAR(100),
  model       VARCHAR(100),
  color       VARCHAR(50),
  year        VARCHAR(4),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicles_customer ON vehicles(customer_id);

-- =====================
-- SERVIÇOS
-- =====================
CREATE TABLE services (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(200) NOT NULL,
  hours            DECIMAL(4,1) NOT NULL DEFAULT 1,
  needs_scheduling BOOLEAN DEFAULT FALSE,
  products         TEXT,
  observation      TEXT,
  price_rule       TEXT,
  per_unit         BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PREÇOS POR TIPO DE VEÍCULO
-- =====================
CREATE TABLE service_pricing (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id   UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  cost_p       DECIMAL(10,2) DEFAULT 0,
  cost_m       DECIMAL(10,2) DEFAULT 0,
  cost_g       DECIMAL(10,2) DEFAULT 0,
  price_p      DECIMAL(10,2) DEFAULT 0,
  price_m      DECIMAL(10,2) DEFAULT 0,
  price_g      DECIMAL(10,2) DEFAULT 0,
  UNIQUE(service_id, vehicle_type)
);

CREATE INDEX idx_service_pricing_service ON service_pricing(service_id);

-- =====================
-- TIPOS DE VEÍCULO POR SERVIÇO
-- =====================
CREATE TABLE service_vehicle_types (
  service_id   UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  PRIMARY KEY (service_id, vehicle_type)
);

-- =====================
-- FUNCIONÁRIOS
-- =====================
CREATE TABLE employees (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(200) NOT NULL,
  role       VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ORDENS DE SERVIÇO
-- =====================
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id      UUID NOT NULL REFERENCES customers(id),
  vehicle_id       UUID NOT NULL REFERENCES vehicles(id),
  vehicle_type     vehicle_type NOT NULL,
  vehicle_size     vehicle_size NOT NULL,
  total            DECIMAL(10,2) NOT NULL,
  pickup_delivery  BOOLEAN DEFAULT FALSE,
  status           VARCHAR(20) DEFAULT 'aberta',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  finished_at      TIMESTAMPTZ
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_vehicle ON orders(vehicle_id);
CREATE INDEX idx_orders_status ON orders(status);

-- =====================
-- ITENS DA ORDEM DE SERVIÇO
-- =====================
CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_id   UUID NOT NULL REFERENCES services(id),
  service_name VARCHAR(200) NOT NULL,
  quantity     INTEGER DEFAULT 1,
  unit_price   DECIMAL(10,2) NOT NULL,
  unit_cost    DECIMAL(10,2) NOT NULL,
  subtotal     DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

---

## Notas de Migração

1. **Limpar localStorage**: Após migrar, remover as chaves `arycar_*` do localStorage.
2. **Camada de serviço**: Substituir as chamadas de `storageService` por chamadas à API/Supabase.
3. **IDs**: O sistema atual usa `Date.now().toString()` como ID. O PostgreSQL usa UUIDs.
4. **Autenticação**: Considerar adicionar tabela de usuários e autenticação para proteger o painel admin.
5. **RLS (Row Level Security)**: Configurar políticas de segurança no Supabase para proteger os dados.

---

## Views Úteis

```sql
-- Margem de lucro por serviço e tipo de veículo
CREATE VIEW v_service_margins AS
SELECT
  s.name AS service_name,
  sp.vehicle_type,
  sp.price_p - sp.cost_p AS margin_p,
  sp.price_m - sp.cost_m AS margin_m,
  sp.price_g - sp.cost_g AS margin_g,
  CASE WHEN sp.price_p > 0 THEN ROUND(((sp.price_p - sp.cost_p) / sp.price_p) * 100, 1) ELSE 0 END AS margin_pct_p
FROM services s
JOIN service_pricing sp ON sp.service_id = s.id;

-- Resumo de faturamento por período
CREATE VIEW v_revenue_summary AS
SELECT
  DATE_TRUNC('month', o.created_at) AS month,
  COUNT(*) AS total_orders,
  SUM(o.total) AS revenue,
  SUM(oi.unit_cost * oi.quantity) AS total_cost,
  SUM(o.total) - SUM(oi.unit_cost * oi.quantity) AS profit
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
GROUP BY DATE_TRUNC('month', o.created_at)
ORDER BY month DESC;
```
