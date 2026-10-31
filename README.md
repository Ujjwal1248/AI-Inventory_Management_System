# AI-Based Retail Inventory Management System

A modern, responsive full-stack inventory management system built with **React**, **Node.js / Express**, and **PostgreSQL**.

---

## 🚀 Status

- **Phase 1 (Dashboard & Core Architecture):** ✅ Complete
- **Phase 2 (Product Management):** ✅ Complete
- **Phase 3 (Inventory Management):** ✅ Complete
- **Phase 4 (POS & Sales Management):** ✅ Complete

---

## 🛠️ Technology Stack

### Frontend
- **React.js 18** (JavaScript, no TypeScript)
- **Vite 5** (Fast build tool & dev server)
- **React Router 6** (Client-side routing)
- **Recharts** (Interactive data visualization charts)
- **Vanilla CSS** with modern design tokens, responsive layout, and thermal receipt print styling

### Backend
- **Node.js & Express.js**
- **pg (node-postgres)** connection pool with transaction client support and row-level locking
- **RESTful API** architecture with modular controllers and routes
- **CORS** & centralized error handling middleware

### Database
- **PostgreSQL 16**
- Relational schema with primary keys, foreign keys, unique constraints, and B-tree indexes
- Automated timestamp triggers (`updated_at`)
- Seed script with realistic retail products, sales orders, and stock movement logs

---

## 📁 Project Structure

```
gemini_Inventory/
├── backend/
│   ├── database/
│   │   ├── schema.sql         # Table definitions (products, sales, sale_items, stock_movements)
│   │   ├── seed.sql           # Realistic demo retail products, sales, and movement audit logs
│   │   ├── setup.js           # CLI script to execute schema.sql
│   │   ├── seed.js            # CLI script to execute seed.sql
│   │   └── reset.js           # CLI script to reset and re-seed database
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js    # PostgreSQL pool and query / getClient transaction helper
│   │   ├── controllers/
│   │   │   ├── dashboardController.js # Dashboard metrics & aggregation
│   │   │   ├── productController.js   # Product CRUD, filters, pagination
│   │   │   ├── inventoryController.js # Inventory valuation, adjustment transaction, movements
│   │   │   └── salesController.js     # POS product search, checkout transaction, sales history
│   │   ├── middleware/
│   │   │   └── errorHandler.js        # Global error & 404 handlers
│   │   ├── routes/
│   │   │   ├── dashboard.js   # /api/dashboard routes
│   │   │   ├── products.js    # /api/products routes
│   │   │   ├── inventory.js   # /api/inventory routes
│   │   │   ├── pos.js         # /api/pos routes
│   │   │   └── sales.js       # /api/sales routes
│   │   └── index.js           # Express app entry point
│   ├── .env                   # Database and server config
│   ├── .env.example           # Example environment template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Layout.jsx      # Shell layout with Sidebar and TopHeader
│   │   │   │   ├── Sidebar.jsx     # Navigation sidebar
│   │   │   │   └── TopHeader.jsx   # Header with title and live date
│   │   │   ├── dashboard/
│   │   │   │   ├── SummaryCards.jsx          # 5 top KPI summary cards
│   │   │   │   ├── MonthlySalesChart.jsx     # Bar chart of 12-month sales
│   │   │   │   ├── StockDistributionChart.jsx# Donut chart by category
│   │   │   │   ├── TopProductsChart.jsx      # Top-selling rankings
│   │   │   │   ├── RecentSales.jsx           # Recent transactions table
│   │   │   │   ├── LowStockProducts.jsx      # Low stock alert table
│   │   │   │   ├── RecentlyAddedProducts.jsx # Latest products list
│   │   │   │   ├── InventorySummary.jsx      # Category valuation summary
│   │   │   │   └── States.jsx                # Loading, Error, and Empty components
│   │   │   ├── products/
│   │   │   │   ├── ProductFormModal.jsx   # Add/Edit product modal with live margin
│   │   │   │   └── DeleteConfirmModal.jsx # Delete confirmation dialog
│   │   │   ├── inventory/
│   │   │   │   ├── StockAdjustmentModal.jsx # Stock adjustment with live preview & negative prevention
│   │   │   │   └── StockHistoryModal.jsx    # Product movement timeline dialog
│   │   │   └── pos/
│   │   │       ├── ProductPicker.jsx      # POS catalog grid with barcode scan input & search
│   │   │       ├── CartPanel.jsx          # POS active cart with stepper, customer, payment & total
│   │   │       └── SaleReceiptModal.jsx   # Professional printable thermal sales receipt
│   │   ├── hooks/
│   │   │   └── useFetch.js    # Reusable data-fetching hook
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Complete dashboard page
│   │   │   ├── Products.jsx       # Complete product listing & filters
│   │   │   ├── ProductDetails.jsx # Detailed single-product page
│   │   │   ├── Inventory.jsx      # Complete 3-tab inventory & valuation page
│   │   │   ├── Sales.jsx          # Complete POS terminal & sales history page
│   │   │   └── PlaceholderPage.jsx# Future phase placeholder
│   │   ├── services/
│   │   │   └── api.js         # Centralized API service layer
│   │   ├── styles/
│   │   │   └── index.css      # Modern styling & design system
│   │   ├── utils/
│   │   │   └── formatters.js  # Currency (₹), numbers, dates, status badges
│   │   ├── App.jsx            # Router configuration
│   │   └── main.jsx           # React root
│   ├── .env                   # Frontend API URL configuration
│   ├── .env.example           # Example frontend environment template
│   ├── vite.config.js         # Vite configuration with proxy
│   └── package.json
└── README.md
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** (v14+) running locally

### 1. Database Setup
Ensure PostgreSQL is running, then run:

```bash
cd backend
npm run db:setup    # Setup schema (creates tables, constraints, indexes)
npm run db:seed     # Seed sample data (products, sales, movements)
```

To drop, recreate, and seed in one step:
```bash
npm run db:reset
```

### 2. Environment Variables Configuration

#### Backend (`backend/.env`):
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

#### Frontend (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5001/api
```

### 3. Start Backend Server
```bash
cd backend
npm run dev    # runs with nodemon on http://localhost:5001
```

### 4. Start Frontend Application
```bash
cd frontend
npm run dev    # runs Vite on http://localhost:5173
```

---

## 🔌 API Reference

### POS & Sales Endpoints (`/api/pos` & `/api/sales` — Phase 4)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/pos/products` | Fast POS product search with partial text and exact barcode matching |
| `POST` | `/api/sales` | Complete sale transaction with backend price calculation, stock deduction, and audit log within an atomic transaction |
| `GET` | `/api/sales` | Paginated sales transactions with search, date filters, payment filters, and summary metrics |
| `GET` | `/api/sales/:id` | Detailed receipt breakdown with line items, unit prices, subtotals, and customer info |

### Inventory Endpoints (`/api/inventory` — Phase 3)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/inventory` | Inventory list with cost & retail valuation, category/stock filters, sorting, and overall metrics |
| `GET` | `/api/inventory/:productId` | Single product inventory details + its movement audit history |
| `POST` | `/api/inventory/adjust` | Manual stock adjustment executed within a database transaction |
| `GET` | `/api/inventory/movements` | Paginated stock movements across all products with search & type filters |
| `GET` | `/api/inventory/low-stock` | Low-stock and out-of-stock items with deficit units & reorder cost |

### Product Endpoints (`/api/products` — Phase 2)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Paginated product list with search, filter, and sort queries |
| `GET` | `/api/products/categories` | Distinct categories list with item counts |
| `GET` | `/api/products/:id` | Full product details including calculated margins and lifetime sales stats |
| `POST` | `/api/products` | Create a new product (validates uniqueness of SKU and Barcode) |
| `PUT` | `/api/products/:id` | Update an existing product |
| `DELETE` | `/api/products/:id` | Delete product and cascading references |

### Dashboard Endpoints (`/api/dashboard` — Phase 1)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/summary` | Total products, stock units, inventory valuation, low stock & out-of-stock count |
| `GET` | `/api/dashboard/sales` | Monthly sales revenue & order counts for the past 12 months |
| `GET` | `/api/dashboard/stock-distribution` | Stock units aggregated by category |
| `GET` | `/api/dashboard/top-products` | Top 10 best-selling products by quantity sold |
| `GET` | `/api/dashboard/recent-sales` | 10 most recent retail sales orders |
| `GET` | `/api/dashboard/low-stock` | Products with stock at or below minimum threshold |
| `GET` | `/api/dashboard/recent-products` | 8 most recently added inventory items |
| `GET` | `/api/dashboard/inventory-summary` | Per-category product count, total stock, avg price, and valuation |

### System
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | PostgreSQL database connection health check |

---

## 🛡️ Business Rules & Transaction Guarantees
1. **Never Trust Frontend Pricing:** Line subtotals and grand totals are calculated autonomously on the backend using the authentic `selling_price` queried directly from PostgreSQL.
2. **Atomic Checkout Transactions:** When checkout occurs:
   - All cart items are checked for sufficient stock under row-level lock (`SELECT ... FOR UPDATE`).
   - If ANY item has insufficient stock, the complete sale is rolled back and an informative error is returned.
   - If stock is sufficient, the `sales` record is created, `sale_items` rows are inserted, product `stock_quantity` is deducted, and `stock_movements` entries are logged as `'Stock sold'` in a single atomic transaction.
3. **Negative Inventory Prevention:** Enforced at both database constraint level (`CHECK (stock_quantity >= 0)`) and transaction pre-check level.
4. **Audit Trail Completeness:** Every checkout automatically logs corresponding movement records referencing the generated `receipt_number`.
