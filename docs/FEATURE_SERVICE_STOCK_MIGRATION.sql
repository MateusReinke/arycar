-- SQL FINAL (idempotente) - Serviços com consumo de produtos e baixa automática de estoque
-- Cenário padrão assumido: products/services/work_orders/work_order_items (com fallback para orders/order_items)

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unit_enum') THEN
    CREATE TYPE unit_enum AS ENUM ('ml', 'l', 'g', 'kg', 'un');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_type') THEN
    CREATE TYPE vehicle_type AS ENUM ('carro', 'moto', 'caminhao');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS vehicle_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code vehicle_type NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL UNIQUE,
  sku VARCHAR(100),
  unit unit_enum NOT NULL,
  stock_current NUMERIC(14,3) NOT NULL DEFAULT 0,
  stock_min NUMERIC(14,3) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  average_time_minutes INTEGER NOT NULL DEFAULT 60,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS average_time_minutes INTEGER NOT NULL DEFAULT 60;
ALTER TABLE services ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS service_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  size CHAR(1) NOT NULL CHECK (size IN ('P','M','G')),
  price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(service_id, vehicle_type, size)
);

CREATE TABLE IF NOT EXISTS service_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  qty NUMERIC(14,3) NOT NULL CHECK (qty > 0),
  unit unit_enum NOT NULL,
  waste_factor NUMERIC(6,4) NOT NULL DEFAULT 0 CHECK (waste_factor >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(service_id, product_id)
);

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  done_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS work_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  done_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  movement_type VARCHAR(30) NOT NULL,
  qty NUMERIC(14,3) NOT NULL,
  unit unit_enum NOT NULL,
  stock_before NUMERIC(14,3) NOT NULL,
  stock_after NUMERIC(14,3) NOT NULL,
  service_id UUID REFERENCES services(id),
  work_order_item_id UUID REFERENCES work_order_items(id),
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION convert_unit(p_qty NUMERIC, p_from unit_enum, p_to unit_enum)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_from = p_to THEN
    RETURN p_qty;
  END IF;

  IF p_from = 'ml' AND p_to = 'l' THEN RETURN p_qty / 1000; END IF;
  IF p_from = 'l' AND p_to = 'ml' THEN RETURN p_qty * 1000; END IF;
  IF p_from = 'g' AND p_to = 'kg' THEN RETURN p_qty / 1000; END IF;
  IF p_from = 'kg' AND p_to = 'g' THEN RETURN p_qty * 1000; END IF;

  RAISE EXCEPTION 'Conversão de unidade não suportada: % -> %', p_from, p_to;
END;
$$;

CREATE OR REPLACE FUNCTION consume_stock_on_done(p_work_order_item_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_item RECORD;
  v_recipe RECORD;
  v_needed NUMERIC(14,3);
  v_before NUMERIC(14,3);
  v_after NUMERIC(14,3);
  v_target_item_table TEXT;
BEGIN
  IF to_regclass('public.work_order_items') IS NOT NULL THEN
    v_target_item_table := 'work_order_items';
  ELSIF to_regclass('public.order_items') IS NOT NULL THEN
    v_target_item_table := 'order_items';
  ELSE
    RAISE EXCEPTION 'Nenhuma tabela de itens de OS encontrada (work_order_items/order_items).';
  END IF;

  IF v_target_item_table = 'work_order_items' THEN
    SELECT * INTO v_item FROM work_order_items WHERE id = p_work_order_item_id FOR UPDATE;
  ELSE
    SELECT id, service_id, quantity, status, done_at
    INTO v_item
    FROM order_items
    WHERE id = p_work_order_item_id
    FOR UPDATE;
  END IF;

  IF v_item.id IS NULL THEN
    RAISE EXCEPTION 'Item de OS % não encontrado.', p_work_order_item_id;
  END IF;

  FOR v_recipe IN
    SELECT
      sp.service_id,
      sp.product_id,
      sp.qty,
      sp.unit,
      sp.waste_factor,
      p.name AS product_name,
      p.unit AS product_unit,
      p.active
    FROM service_products sp
    JOIN products p ON p.id = sp.product_id
    WHERE sp.service_id = v_item.service_id
  LOOP
    IF v_recipe.active IS NOT TRUE THEN
      RAISE EXCEPTION 'Produto % está inativo, baixa automática bloqueada.', v_recipe.product_name;
    END IF;

    v_needed := convert_unit(v_recipe.qty, v_recipe.unit, v_recipe.product_unit) * v_item.quantity * (1 + v_recipe.waste_factor);

    SELECT stock_current INTO v_before FROM products WHERE id = v_recipe.product_id FOR UPDATE;
    v_after := v_before - v_needed;

    IF v_after < 0 THEN
      RAISE EXCEPTION 'Estoque insuficiente: produto=% | atual=% | necessário=% | déficit=%',
        v_recipe.product_name,
        v_before,
        v_needed,
        ABS(v_after);
    END IF;

    UPDATE products
    SET stock_current = v_after,
        updated_at = NOW()
    WHERE id = v_recipe.product_id;

    INSERT INTO stock_movements(
      product_id,
      movement_type,
      qty,
      unit,
      stock_before,
      stock_after,
      service_id,
      work_order_item_id,
      details
    ) VALUES (
      v_recipe.product_id,
      'service_consumption',
      v_needed,
      v_recipe.product_unit,
      v_before,
      v_after,
      v_recipe.service_id,
      v_item.id,
      jsonb_build_object(
        'recipe_qty', v_recipe.qty,
        'recipe_unit', v_recipe.unit,
        'waste_factor', v_recipe.waste_factor,
        'order_qty', v_item.quantity
      )
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION trg_consume_stock_on_item_done()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) AND UPPER(NEW.status) = 'DONE' THEN
    PERFORM consume_stock_on_done(NEW.id);
    IF NEW.done_at IS NULL THEN
      NEW.done_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.work_order_items') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_work_order_items_consume_stock') THEN
      CREATE TRIGGER trg_work_order_items_consume_stock
      BEFORE UPDATE ON work_order_items
      FOR EACH ROW
      EXECUTE FUNCTION trg_consume_stock_on_item_done();
    END IF;
  END IF;

  IF to_regclass('public.order_items') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_order_items_consume_stock') THEN
      CREATE TRIGGER trg_order_items_consume_stock
      BEFORE UPDATE ON order_items
      FOR EACH ROW
      EXECUTE FUNCTION trg_consume_stock_on_item_done();
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_prices_service_vehicle ON service_prices(service_id, vehicle_type);
CREATE INDEX IF NOT EXISTS idx_service_products_service_id ON service_products(service_id);
CREATE INDEX IF NOT EXISTS idx_service_products_product_id ON service_products(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_created ON stock_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(work_order_item_id);
CREATE INDEX IF NOT EXISTS idx_products_stock_alert ON products(stock_current, stock_min);
CREATE INDEX IF NOT EXISTS idx_work_order_items_status_done ON work_order_items(status, done_at);

INSERT INTO vehicle_types (code, label)
VALUES
  ('carro', 'Carro'),
  ('moto', 'Moto'),
  ('caminhao', 'Caminhão')
ON CONFLICT (code) DO NOTHING;

INSERT INTO products (name, unit, stock_current, stock_min)
VALUES
  ('Shampoo Neutro', 'l', 20, 5),
  ('Cera Líquida', 'ml', 10000, 2000),
  ('Pano Microfibra', 'un', 100, 20)
ON CONFLICT (name) DO NOTHING;

INSERT INTO services (name, description, average_time_minutes, active)
VALUES
  ('Lavagem Técnica', 'Lavagem externa com shampoo neutro', 90, TRUE),
  ('Higienização Interna', 'Limpeza completa interna com acabamento', 120, TRUE)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  s_lavagem UUID;
  s_hig UUID;
  p_shampoo UUID;
  p_cera UUID;
  p_pano UUID;
BEGIN
  SELECT id INTO s_lavagem FROM services WHERE name = 'Lavagem Técnica' LIMIT 1;
  SELECT id INTO s_hig FROM services WHERE name = 'Higienização Interna' LIMIT 1;
  SELECT id INTO p_shampoo FROM products WHERE name = 'Shampoo Neutro' LIMIT 1;
  SELECT id INTO p_cera FROM products WHERE name = 'Cera Líquida' LIMIT 1;
  SELECT id INTO p_pano FROM products WHERE name = 'Pano Microfibra' LIMIT 1;

  IF s_lavagem IS NOT NULL AND p_shampoo IS NOT NULL THEN
    INSERT INTO service_products(service_id, product_id, qty, unit, waste_factor)
    VALUES (s_lavagem, p_shampoo, 120, 'ml', 0.05)
    ON CONFLICT (service_id, product_id) DO NOTHING;
  END IF;

  IF s_lavagem IS NOT NULL AND p_cera IS NOT NULL THEN
    INSERT INTO service_products(service_id, product_id, qty, unit, waste_factor)
    VALUES (s_lavagem, p_cera, 80, 'ml', 0.03)
    ON CONFLICT (service_id, product_id) DO NOTHING;
  END IF;

  IF s_hig IS NOT NULL AND p_pano IS NOT NULL THEN
    INSERT INTO service_products(service_id, product_id, qty, unit, waste_factor)
    VALUES (s_hig, p_pano, 2, 'un', 0)
    ON CONFLICT (service_id, product_id) DO NOTHING;
  END IF;

  IF s_lavagem IS NOT NULL THEN
    INSERT INTO service_prices(service_id, vehicle_type, size, price)
    VALUES
      (s_lavagem, 'carro', 'P', 80),
      (s_lavagem, 'carro', 'M', 100),
      (s_lavagem, 'carro', 'G', 130),
      (s_lavagem, 'moto', 'P', 50),
      (s_lavagem, 'moto', 'M', 60),
      (s_lavagem, 'moto', 'G', 70),
      (s_lavagem, 'caminhao', 'P', 180),
      (s_lavagem, 'caminhao', 'M', 220),
      (s_lavagem, 'caminhao', 'G', 280)
    ON CONFLICT (service_id, vehicle_type, size) DO NOTHING;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'products') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE products, service_prices, service_products, stock_movements, vehicle_types TO authenticated, service_role';
    EXECUTE 'GRANT SELECT ON TABLE products, service_prices, service_products, vehicle_types TO anon';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- roles podem não existir fora do Supabase
    NULL;
END $$;

DO $$
DECLARE
  has_rls BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO has_rls FROM pg_class WHERE relname = 'products' LIMIT 1;
  IF has_rls THEN
    EXECUTE 'ALTER TABLE products ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE service_products ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE service_prices ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'products_read') THEN
      EXECUTE 'CREATE POLICY products_read ON products FOR SELECT TO anon, authenticated USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'products_write') THEN
      EXECUTE 'CREATE POLICY products_write ON products FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_products' AND policyname = 'service_products_rw') THEN
      EXECUTE 'CREATE POLICY service_products_rw ON service_products FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_prices' AND policyname = 'service_prices_rw') THEN
      EXECUTE 'CREATE POLICY service_prices_rw ON service_prices FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_movements' AND policyname = 'stock_movements_read') THEN
      EXECUTE 'CREATE POLICY stock_movements_read ON stock_movements FOR SELECT TO authenticated, service_role USING (true)';
    END IF;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

COMMIT;
