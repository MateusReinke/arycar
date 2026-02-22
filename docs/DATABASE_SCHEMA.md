# 🗄️ ARYCAR - Schema PostgreSQL + API REST

Este documento descreve a estrutura de banco de dados e os endpoints REST necessários para conectar o AryCar ao seu backend Docker.

---

## 🐳 Configuração de Conexão (Docker)

```javascript
// src/config/api.ts - Altere o API_BASE_URL para apontar para seu backend
const apiConfig = {
  API_BASE_URL: 'http://localhost:3001/api', // URL da sua API
};

// No seu backend (Express/Fastify), configure a conexão:
const dbConfig = {
  user: 'seu_usuario_postgre',     // Altere aqui
  host: 'localhost',                // IP do container ou 'localhost'
  database: 'arycar_db',           // Nome do banco
  password: 'sua_senha_aqui',      // Altere aqui
  port: 5455,                      // Porta do PostgreSQL
};
```

### Docker Compose de referência para o banco:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: arycar_user
      POSTGRES_PASSWORD: arycar_pass_123
      POSTGRES_DB: arycar_db
    ports:
      - "5455:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  pgdata:
```

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
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CLIENTES
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

-- VEÍCULOS
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
  km          VARCHAR(10),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicles_customer ON vehicles(customer_id);

-- SERVIÇOS
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

-- PREÇOS POR TIPO DE VEÍCULO
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

-- TIPOS DE VEÍCULO POR SERVIÇO
CREATE TABLE service_vehicle_types (
  service_id   UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  PRIMARY KEY (service_id, vehicle_type)
);

-- FUNCIONÁRIOS
CREATE TABLE employees (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(200) NOT NULL,
  role       VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDENS DE SERVIÇO
CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id       UUID NOT NULL REFERENCES customers(id),
  vehicle_id        UUID NOT NULL REFERENCES vehicles(id),
  vehicle_type      vehicle_type NOT NULL,
  vehicle_size      vehicle_size NOT NULL,
  total             DECIMAL(10,2) NOT NULL,
  pickup_delivery   BOOLEAN DEFAULT FALSE,
  description       TEXT,
  technical_notes   TEXT,
  status            VARCHAR(20) DEFAULT 'aberta',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  finished_at       TIMESTAMPTZ
);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_vehicle ON orders(vehicle_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ITENS DA ORDEM DE SERVIÇO
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

-- CONFIGURAÇÕES
CREATE TABLE settings (
  key   VARCHAR(50) PRIMARY KEY,
  value TEXT
);
INSERT INTO settings (key, value) VALUES ('whatsapp_number', '');
```

---

## 📡 Endpoints REST (para seu backend)

O frontend está preparado para consumir estes endpoints quando `API_BASE_URL` estiver configurado em `src/config/api.ts`:

### Clientes
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/customers` | Listar todos os clientes |
| GET | `/api/customers/:id` | Buscar por ID |
| GET | `/api/customers/cpf/:cpf` | Buscar por CPF |
| POST | `/api/customers` | Criar cliente |
| PUT | `/api/customers/:id` | Atualizar cliente |

### Veículos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/vehicles` | Listar todos |
| GET | `/api/vehicles/plate/:plate` | Buscar por placa |
| GET | `/api/vehicles/customer/:customerId` | Veículos de um cliente |
| POST | `/api/vehicles` | Cadastrar veículo |

### Serviços
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/services` | Listar todos (com pricing) |
| POST | `/api/services` | Criar serviço |
| PUT | `/api/services/:id` | Atualizar serviço |
| DELETE | `/api/services/:id` | Remover serviço |

### Ordens de Serviço
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/orders` | Listar todas |
| GET | `/api/orders/:id` | Buscar por ID |
| POST | `/api/orders` | Criar OS (com items) |
| PUT | `/api/orders/:id/status` | Atualizar status |

### Funcionários
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/employees` | Listar todos |
| POST | `/api/employees` | Criar |
| PUT | `/api/employees/:id` | Atualizar |
| DELETE | `/api/employees/:id` | Remover |

### Configurações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/settings/:key` | Buscar configuração |
| PUT | `/api/settings/:key` | Atualizar configuração |

### Consulta de Placa (proxy)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/plate-lookup/:plate` | Proxy para API de placas |

---

## Views Úteis

```sql
CREATE VIEW v_service_margins AS
SELECT
  s.name AS service_name,
  sp.vehicle_type,
  sp.price_p - sp.cost_p AS margin_p,
  sp.price_m - sp.cost_m AS margin_m,
  sp.price_g - sp.cost_g AS margin_g
FROM services s
JOIN service_pricing sp ON sp.service_id = s.id;

CREATE VIEW v_revenue_summary AS
SELECT
  DATE_TRUNC('month', o.created_at) AS month,
  COUNT(*) AS total_orders,
  SUM(o.total) AS revenue
FROM orders o
GROUP BY DATE_TRUNC('month', o.created_at)
ORDER BY month DESC;
```

---

## Notas

1. **Atual**: O sistema usa localStorage. Quando `API_BASE_URL` estiver preenchido em `src/config/api.ts`, o sistema passará a consumir a API REST.
2. **IDs**: O localStorage usa `Date.now()`. O PostgreSQL usa UUIDs.
3. **API de Placas**: A chave da API (placas.app.br) deve ser configurada em `src/config/api.ts` ou, preferencialmente, no seu backend como proxy.
4. **FIPE**: A API FIPE é gratuita e chamada diretamente do frontend.
