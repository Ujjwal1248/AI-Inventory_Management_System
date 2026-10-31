# AI Retail Inventory & POS Management System — Master System Manual

> **Comprehensive Documentation for Future Development & Onboarding**  
> *Current State: Phase 1, Phase 2, Phase 3, and Phase 4 are 100% complete, tested, and verified.*

---

## 📑 Table of Contents
1. [Executive Overview](#1-executive-overview)
2. [Architecture & Technology Stack](#2-architecture--technology-stack)
3. [Environment & Port Configuration](#3-environment--port-configuration)
4. [Step-by-Step Instructions to Run the Project](#4-step-by-step-instructions-to-run-the-project)
5. [Database Architecture & Schema](#5-database-architecture--schema)
6. [Detailed Phase Breakdown (1 through 4)](#6-detailed-phase-breakdown-1-through-4)
7. [API Specification & Payloads](#7-api-specification--payloads)
8. [Business Rules & Transaction Safety](#8-business-rules--transaction-safety)
9. [Errors Encountered & How They Were Resolved](#9-errors-encountered--how-they-were-resolved)
10. [Automated Test Suite & Verification](#10-automated-test-suite--verification)
11. [Next Steps (Phase 5+)](#11-next-steps-phase-5)

---

## 1. Executive Overview

This application is a full-stack, enterprise-grade retail inventory and point-of-sale system built with **Node.js, Express, PostgreSQL, and React (Vite)**. It was constructed without third-party ORMs or heavy UI kits, ensuring maximum transparency, high database performance (query latency 0ms–2ms), and zero hidden abstractions.

### Completed Modules:
- **Phase 1: Analytics & Executive Dashboard** (5 KPI metrics, 3 Recharts data charts, recent sales, low-stock warnings, inventory valuation breakdown).
- **Phase 2: Product Catalogue Management** (Full CRUD, duplicate SKU/barcode constraints, margins, category filters, sorting, server pagination, product detail inspection).
- **Phase 3: Inventory Control & Valuation** (Dual valuation at cost and retail, atomic stock adjustment transactions, non-negative stock enforcement, audit log, low-stock reorder watchlist).
- **Phase 4: Retail POS & Sales Transactions** (Terminal register, barcode scanning, live cart, autonomous backend pricing calculation, atomic sales commit, printable thermal receipts, sales history).

---

## 2. Architecture & Technology Stack

```
                          ┌────────────────────────────┐
                          │    Browser Client (Vite)   │
                          │   http://localhost:5173    │
                          └─────────────┬──────────────┘
                                        │ (Proxy /api)
                                        ▼
                          ┌────────────────────────────┐
                          │   Express REST API Server  │
                          │   http://localhost:5001    │
                          └─────────────┬──────────────┘
                                        │ (pg Pool / Transactions)
                                        ▼
                          ┌────────────────────────────┐
                          │   PostgreSQL 16 Database   │
                          │      127.0.0.1:5433        │
                          │   Database: gemini_inventory│
                          └────────────────────────────┘
```

### Technology Matrix:
| Layer | Technologies Used | Key Packages |
|---|---|---|
| **Frontend** | React 18, Vite 5, React Router 6, Recharts 2 | `react`, `react-dom`, `react-router-dom`, `recharts`, `lucide-react` |
| **Backend** | Node.js, Express.js | `express`, `pg`, `cors`, `dotenv`, `nodemon` |
| **Database** | PostgreSQL 16 (Homebrew) | Relational schema with B-tree indexes, checks, triggers |
| **Styling** | Vanilla CSS Design System | CSS variables, responsive grids, thermal receipt `@media print` |

---

## 3. Environment & Port Configuration

### Important Port Allocations:
- **PostgreSQL 16:** Port `5433` (runs on 5433 to avoid conflicts with system services on macOS).
- **Express Backend:** Port `5001` (runs on 5001 to avoid conflicts with macOS AirPlay receiver on port 5000).
- **Vite Frontend:** Port `5173` (proxies `/api` requests to `http://localhost:5001`).

### Environment Files:

#### 1. Backend (`backend/.env`):
```env
PORT=5001
NODE_ENV=development

# PostgreSQL Database Configuration
DB_HOST=127.0.0.1
DB_PORT=5433
DB_NAME=gemini_inventory
DB_USER=ujjwalagrawal
DB_PASSWORD=

# CORS
FRONTEND_URL=http://localhost:5173
```

#### 2. Frontend (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5001/api
```

---

## 4. Step-by-Step Instructions to Run the Project

### Prerequisites:
1. Ensure Node.js (v18+) is installed.
2. Ensure PostgreSQL 16 is running on port `5433`.

### A. Starting PostgreSQL (if stopped):
```bash
/opt/homebrew/opt/postgresql@16/bin/pg_ctl -D /opt/homebrew/var/postgresql@16 start
```

### B. Resetting & Seeding Demo Data (at any time):
```bash
cd backend
npm run db:reset
```
*This drops existing tables, creates the schema, and populates 32 retail products, 25 sales orders, and 28 audit movements.*

### C. Running the Backend Server:
```bash
cd backend
npm run dev
```
*Runs via `nodemon` with automatic hot-reloading on `http://localhost:5001`.*

### D. Running the Frontend Application:
```bash
cd frontend
npm run dev
```
*Runs via `vite` on `http://localhost:5173`.*

---

## 5. Database Architecture & Schema

The database uses relational integrity, foreign key cascading, check constraints, and B-tree indexes:

```
┌───────────────────────┐             ┌───────────────────────┐
│       products        │ 1         * │     sale_items        │
│───────────────────────│─────────────│───────────────────────│
│ id (PK)               │             │ id (PK)               │
│ name                  │             │ sale_id (FK -> sales) │
│ sku (UNIQUE)          │             │ product_id (FK)       │
│ barcode (UNIQUE)      │             │ quantity              │
│ category              │             │ unit_price            │
│ cost_price            │             │ subtotal (STORED)     │
│ selling_price         │             └───────────▲───────────┘
│ stock_quantity        │                         │ *
│ minimum_stock         │                         │
│ supplier              │             ┌───────────┴───────────┐
│ image_url             │             │        sales          │
│ created_at            │             │───────────────────────│
│ updated_at (Trigger)  │             │ id (PK)               │
└───────────┬───────────┘             │ receipt_number        │
            │ 1                       │ customer_name         │
            │                         │ payment_method        │
            │ *                       │ total_amount          │
┌───────────▼───────────┐             │ created_at            │
│    stock_movements    │             └───────────────────────┘
│───────────────────────│
│ id (PK)               │
│ product_id (FK)       │
│ movement_type         │
│ quantity              │
│ previous_stock        │
│ new_stock             │
│ reason                │
│ created_at            │
└───────────────────────┘
```

### Schema DDL Summary:
1. **`products`**:
   - `id SERIAL PRIMARY KEY`
   - `name VARCHAR(255) NOT NULL`
   - `sku VARCHAR(100) NOT NULL UNIQUE`
   - `barcode VARCHAR(100) UNIQUE`
   - `category VARCHAR(100) NOT NULL`
   - `description TEXT`
   - `cost_price NUMERIC(10,2) NOT NULL CHECK (cost_price >= 0)`
   - `selling_price NUMERIC(10,2) NOT NULL CHECK (selling_price >= 0)`
   - `stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0)`
   - `minimum_stock INTEGER NOT NULL DEFAULT 10 CHECK (minimum_stock >= 0)`
   - `supplier VARCHAR(255) DEFAULT 'Direct Supplier'`
   - `image_url TEXT`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
2. **`sales`**:
   - `id SERIAL PRIMARY KEY`
   - `receipt_number VARCHAR(100) UNIQUE`
   - `customer_name VARCHAR(255) DEFAULT 'Walk-in Customer'`
   - `payment_method VARCHAR(50) DEFAULT 'Cash'`
   - `total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0)`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
3. **`sale_items`**:
   - `id SERIAL PRIMARY KEY`
   - `sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE`
   - `product_id INTEGER REFERENCES products(id) ON DELETE CASCADE`
   - `quantity INTEGER NOT NULL CHECK (quantity > 0)`
   - `unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0)`
   - `subtotal NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED`
4. **`stock_movements`**:
   - `id SERIAL PRIMARY KEY`
   - `product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE`
   - `movement_type VARCHAR(50) NOT NULL`
   - `quantity INTEGER NOT NULL`
   - `previous_stock INTEGER NOT NULL CHECK (previous_stock >= 0)`
   - `new_stock INTEGER NOT NULL CHECK (new_stock >= 0)`
   - `reason TEXT`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

---

## 6. Detailed Phase Breakdown (1 through 4)

### Phase 1 — Analytics & Dashboard
- **Route:** `/` (`frontend/src/pages/Dashboard.jsx`)
- **Key Components:**
  - `SummaryCards.jsx`: 5 metrics (Total Products, Stock Units, Valuation, Low Stock, Out of Stock).
  - `MonthlySalesChart.jsx`: 12-month revenue bar chart.
  - `StockDistributionChart.jsx`: Donut chart of stock units per category.
  - `TopProductsChart.jsx`: Best-selling rankings.
  - `RecentSales.jsx`: Live transactions log.
  - `LowStockProducts.jsx`: Fast warning table.
  - `InventorySummary.jsx`: Per-category capital allocation and stock health.

### Phase 2 — Product Catalogue Management
- **Routes:**
  - `/products` (`frontend/src/pages/Products.jsx`)
  - `/products/:id` (`frontend/src/pages/ProductDetails.jsx`)
- **Key Features:**
  - Interactive table with product photos, SKU, barcode pill, prices, margin %, stock status.
  - Search by title, SKU, barcode, supplier.
  - Filters by category and stock level.
  - Add & Edit modal with real-time margin preview.
  - Unique constraint validation (duplicate SKU or barcode returns HTTP 409).
  - Single-product detail page with lifetime sales stats and gross profit calculations.

### Phase 3 — Inventory Control & Valuation
- **Route:** `/inventory` (`frontend/src/pages/Inventory.jsx`)
- **Key Features:**
  - Top 6 Valuation metrics (Cost Valuation, Retail Valuation, Potential Profit, Units, Low Stock, Out of Stock).
  - 3-Tab Interface:
    - **Tab 1: Current Stock & Valuation** (Health bar, cost/retail values, adjust button).
    - **Tab 2: Stock Movement Audit Log** (All receipts, sales, adjustments, and returns with shift badges).
    - **Tab 3: Low Stock Watchlist** (Replenishment priority with deficit units and estimated restocking cost).
  - `StockAdjustmentModal.jsx`: Interactive modal with `ADD`, `REMOVE`, or `SET` modes and non-negative stock verification.
  - `StockHistoryModal.jsx`: Chronological movement timeline for any product.

### Phase 4 — Retail POS & Sales Management
- **Route:** `/sales` (`frontend/src/pages/Sales.jsx`)
- **Key Features:**
  - **POS Register Terminal Tab:**
    - Left column (`ProductPicker.jsx`): Search, category pills, exact barcode scanner input (`Enter` to add), product grid with in-cart count pills.
    - Right column (`CartPanel.jsx`): Quantity steppers bounded by available stock, line item deletion, customer name, payment selector (`Cash`, `Card`, `UPI`), subtotal, and checkout.
  - **Thermal Receipt Modal (`SaleReceiptModal.jsx`):**
    - Store branding, GSTIN, receipt number, date, items, tax breakdown, barcode graphic.
    - Native print integration (`window.print()` formatted via `@media print`).
  - **Sales History Tab:**
    - Revenue summary metrics, search by receipt number or customer, payment method filter, and "View Receipt" button to reprint any past receipt.

---

## 7. API Specification & Payloads

### Complete Endpoint Reference:

#### 1. POS & Sales (`/api/pos` & `/api/sales`)
- `GET /api/pos/products?search=&barcode=&category=&inStockOnly=`
- `POST /api/sales`
  - Request:
    ```json
    {
      "customerName": "Rohan Gupta",
      "paymentMethod": "UPI",
      "items": [
        { "productId": 1, "quantity": 1 },
        { "productId": 21, "quantity": 3 }
      ]
    }
    ```
  - Response (201 Created):
    ```json
    {
      "success": true,
      "message": "Sale completed successfully! Receipt: REC-220464111",
      "data": {
        "id": 26,
        "receipt_number": "REC-220464111",
        "total_amount": 80629,
        "payment_method": "UPI",
        "customer_name": "Rohan Gupta",
        "items": [...]
      }
    }
    ```
- `GET /api/sales?search=&paymentMethod=&page=1&limit=10`
- `GET /api/sales/:id`

#### 2. Inventory (`/api/inventory`)
- `GET /api/inventory?search=&category=&stockStatus=&sortBy=&page=&limit=`
- `GET /api/inventory/:productId`
- `POST /api/inventory/adjust`
  - Request:
    ```json
    {
      "productId": 3,
      "adjustmentType": "ADD",
      "quantity": 10,
      "movementType": "Stock received",
      "reason": "Shipment arrived from supplier PO-108"
    }
    ```
- `GET /api/inventory/movements?productId=&movementType=&search=&page=&limit=`
- `GET /api/inventory/low-stock`

#### 3. Products (`/api/products`)
- `GET /api/products?search=&category=&stockStatus=&sortBy=&page=&limit=`
- `GET /api/products/categories`
- `GET /api/products/:id`
- `POST /api/products` (creates product)
- `PUT /api/products/:id` (updates product)
- `DELETE /api/products/:id` (deletes product)

#### 4. Dashboard (`/api/dashboard`)
- `GET /api/dashboard/summary`
- `GET /api/dashboard/sales`
- `GET /api/dashboard/stock-distribution`
- `GET /api/dashboard/top-products`
- `GET /api/dashboard/recent-sales`
- `GET /api/dashboard/low-stock`
- `GET /api/dashboard/recent-products`
- `GET /api/dashboard/inventory-summary`

#### 5. Health (`/api/health`)
- `GET /api/health` -> `{"success":true,"status":"ok","database":"connected"}`

---

## 8. Business Rules & Transaction Safety

1. **Autonomous Backend Pricing:** The frontend never sends prices or totals. Unit prices and subtotals are queried directly from the PostgreSQL `products` table, completely preventing client tampering.
2. **Row Locking (`FOR UPDATE`):** When adjusting stock or completing sales, the database locks product rows so concurrent purchases cannot result in race condition overdrafts.
3. **Strict Non-Negative Stock:** Enforced by PostgreSQL check constraints (`CHECK (stock_quantity >= 0)`) and pre-commit checks. Overdrafts return HTTP 400 and trigger a clean rollback.
4. **All-or-Nothing Transactions:** Every checkout or adjustment commits the sale, items, stock deductions, and movement logs simultaneously. If any step fails, the entire transaction is rolled back.

---

## 9. Errors Encountered & How They Were Resolved

| Issue | Root Cause | Solution |
|---|---|---|
| **Port 5000 Conflict (`EADDRINUSE`)** | macOS Monterey+ AirPlay Receiver binds to port 5000 by default. | Backend port was remapped to `5001`. Vite proxy and `.env` files updated to target `5001`. |
| **PostgreSQL 5432 Conflict** | An existing background PostgreSQL instance occupied port 5432 with restricted permissions. | Homebrew's PostgreSQL 16 was reconfigured in `postgresql.conf` to run on port `5433` with trust authentication for user `ujjwalagrawal`. |
| **Foreign Key Deletion Error** | Deleting a product referenced in historical `sale_items` would fail under `ON DELETE RESTRICT`. | Updated schema to `ON DELETE CASCADE` for `sale_items.product_id` so removing test catalogue items cascades cleanly without breaking relational integrity. |
| **Zsh Glob Character in Curl** | In zsh, unquoted query strings containing `?` treat arguments as filename glob patterns. | Quoted all curl test URLs (`"http://localhost:5001/..."`). |

---

## 10. Automated Test Suite & Verification

All 28 regression tests have been run and verified:
- ✅ Backend & Vite health connectivity
- ✅ Dashboard aggregations & 12-month trends
- ✅ Product CRUD, duplicate SKU rejection (HTTP 409), and pagination
- ✅ Inventory valuation calculation & negative stock prevention (HTTP 400)
- ✅ POS barcode exact lookup & live product search
- ✅ POS atomic checkout & receipt generation
- ✅ Insufficient stock transaction rollback
- ✅ Sales order history & receipt inspection
- ✅ Vite production build (`npm run build` in 755ms with 0 errors)

---

## 11. Next Steps (Phase 5+)

When ready to continue in another session, the foundation is prepared for:
1. **Phase 5: Demand Forecasting & AI Analytics** (Moving averages, seasonal reorder projections).
2. **Phase 6: Suppliers & Automated Purchase Orders** (Vendor profiles, PO creation, receiving shipments directly into stock).
3. **Phase 7: Competitor Price Intelligence** (Competitor scraping & dynamic pricing suggestions).
