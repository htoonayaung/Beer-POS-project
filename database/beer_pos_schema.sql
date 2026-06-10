PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE CHECK (name IN ('Admin', 'Manager', 'Cashier')),
  permissions TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  pin_hash TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Locked')),
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  item_code TEXT NOT NULL UNIQUE,
  barcode TEXT UNIQUE,
  item_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  purchase_price NUMERIC NOT NULL CHECK (purchase_price >= 0),
  selling_price NUMERIC NOT NULL CHECK (selling_price >= 0),
  current_stock NUMERIC NOT NULL DEFAULT 0,
  minimum_stock NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  image_url TEXT,
  average_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS dining_tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_no TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Reserved'))
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no TEXT NOT NULL UNIQUE,
  customer_id INTEGER REFERENCES customers(id),
  table_no TEXT,
  waiter_name TEXT,
  guest_count INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC NOT NULL,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  service_charge NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  profit NUMERIC NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'KBZPay', 'WavePay', 'AYA Pay', 'Credit', 'Split')),
  cash_received NUMERIC NOT NULL DEFAULT 0,
  change_amount NUMERIC NOT NULL DEFAULT 0,
  cashier_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'Paid' CHECK (status IN ('Paid', 'Held', 'Voided', 'Refunded')),
  sold_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  item_note TEXT,
  qty NUMERIC NOT NULL CHECK (qty > 0),
  unit_price NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL,
  line_profit NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  type TEXT NOT NULL CHECK (type IN ('Stock In', 'Stock Out', 'Damage/Loss', 'Supplier Purchase', 'Sale Deduction', 'Refund Restore', 'Audit')),
  qty NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  reference TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  note TEXT,
  created_by INTEGER REFERENCES users(id),
  spent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS income (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  note TEXT,
  created_by INTEGER REFERENCES users(id),
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_closing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_date TEXT NOT NULL,
  cashier_id INTEGER NOT NULL REFERENCES users(id),
  opening_cash NUMERIC NOT NULL DEFAULT 0,
  cash_sales NUMERIC NOT NULL DEFAULT 0,
  digital_sales NUMERIC NOT NULL DEFAULT 0,
  expenses NUMERIC NOT NULL DEFAULT 0,
  refunds NUMERIC NOT NULL DEFAULT 0,
  expected_cash NUMERIC NOT NULL DEFAULT 0,
  actual_cash NUMERIC NOT NULL DEFAULT 0,
  difference NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  closed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (business_date, cashier_id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(current_stock, minimum_stock);
CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON sales(sold_at);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_no);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_date ON inventory_transactions(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(spent_at);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(received_at);

CREATE TRIGGER IF NOT EXISTS trg_sale_item_stock_deduct
AFTER INSERT ON sale_items
BEGIN
  UPDATE products
  SET current_stock = current_stock - NEW.qty,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.product_id;

  INSERT INTO inventory_transactions(product_id, type, qty, unit_cost, reference)
  SELECT NEW.product_id, 'Sale Deduction', -NEW.qty, NEW.unit_cost, invoice_no
  FROM sales
  WHERE id = NEW.sale_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_sale_refund_stock_restore
AFTER UPDATE OF status ON sales
WHEN NEW.status = 'Refunded' AND OLD.status <> 'Refunded'
BEGIN
  UPDATE products
  SET current_stock = current_stock + (
    SELECT COALESCE(SUM(qty), 0)
    FROM sale_items
    WHERE sale_items.sale_id = NEW.id AND sale_items.product_id = products.id
  ),
  updated_at = CURRENT_TIMESTAMP
  WHERE id IN (SELECT product_id FROM sale_items WHERE sale_id = NEW.id);

  INSERT INTO inventory_transactions(product_id, type, qty, unit_cost, reference)
  SELECT product_id, 'Refund Restore', qty, unit_cost, NEW.invoice_no
  FROM sale_items
  WHERE sale_id = NEW.id;
END;
