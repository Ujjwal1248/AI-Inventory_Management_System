-- =============================================================
-- Gemini Inventory — Database Schema
-- Run this file to create all tables.
-- =============================================================

-- Drop tables if re-running (order matters due to foreign keys)
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS sale_items      CASCADE;
DROP TABLE IF EXISTS sales           CASCADE;
DROP TABLE IF EXISTS products        CASCADE;

-- =============================================================
-- TABLE: products
-- =============================================================
CREATE TABLE products (
  id              SERIAL        PRIMARY KEY,
  name            VARCHAR(255)  NOT NULL,
  sku             VARCHAR(100)  NOT NULL UNIQUE,
  barcode         VARCHAR(100)  UNIQUE,
  category        VARCHAR(100)  NOT NULL,
  description     TEXT,
  cost_price      NUMERIC(10,2) NOT NULL CHECK (cost_price >= 0),
  selling_price   NUMERIC(10,2) NOT NULL CHECK (selling_price >= 0),
  stock_quantity  INTEGER       NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  minimum_stock   INTEGER       NOT NULL DEFAULT 10 CHECK (minimum_stock >= 0),
  supplier        VARCHAR(255)  DEFAULT 'Direct Supplier',
  image_url       TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Indexes for commonly filtered/searched columns
CREATE INDEX idx_products_category       ON products (category);
CREATE INDEX idx_products_stock_quantity ON products (stock_quantity);
CREATE INDEX idx_products_sku            ON products (sku);
CREATE INDEX idx_products_barcode        ON products (barcode);
CREATE INDEX idx_products_name           ON products (name);

-- =============================================================
-- TABLE: sales
-- =============================================================
CREATE TABLE sales (
  id              SERIAL        PRIMARY KEY,
  receipt_number  VARCHAR(100)  UNIQUE,
  customer_name   VARCHAR(255)  DEFAULT 'Walk-in Customer',
  payment_method  VARCHAR(50)   DEFAULT 'Cash',
  total_amount    NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_created_at     ON sales (created_at);
CREATE INDEX idx_sales_receipt_number ON sales (receipt_number);

-- =============================================================
-- TABLE: sale_items
-- Each row = one product line in a sale transaction
-- =============================================================
CREATE TABLE sale_items (
  id          SERIAL        PRIMARY KEY,
  sale_id     INTEGER       NOT NULL REFERENCES sales(id)    ON DELETE CASCADE,
  product_id  INTEGER       REFERENCES products(id)          ON DELETE CASCADE,
  quantity    INTEGER       NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal    NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

CREATE INDEX idx_sale_items_sale_id    ON sale_items (sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items (product_id);

-- =============================================================
-- TABLE: stock_movements (Phase 3)
-- Tracks all stock adjustments, shipments, sales & returns
-- =============================================================
CREATE TABLE stock_movements (
  id              SERIAL        PRIMARY KEY,
  product_id      INTEGER       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type   VARCHAR(50)   NOT NULL,
  quantity        INTEGER       NOT NULL,
  previous_stock  INTEGER       NOT NULL CHECK (previous_stock >= 0),
  new_stock       INTEGER       NOT NULL CHECK (new_stock >= 0),
  reason          TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_product_id    ON stock_movements (product_id);
CREATE INDEX idx_stock_movements_movement_type ON stock_movements (movement_type);
CREATE INDEX idx_stock_movements_created_at    ON stock_movements (created_at DESC);

-- =============================================================
-- Trigger: auto-update products.updated_at
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

SELECT 'Schema created successfully.' AS status;
