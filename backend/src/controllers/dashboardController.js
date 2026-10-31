const { query } = require('../config/database');

/**
 * GET /api/dashboard/summary
 * Returns aggregated counts and values for the dashboard header cards.
 */
const getSummary = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        COUNT(*)::int                                            AS total_products,
        COALESCE(SUM(stock_quantity), 0)::int                  AS total_stock_units,
        COALESCE(SUM(stock_quantity * selling_price), 0)       AS total_inventory_value,
        COUNT(*) FILTER (WHERE stock_quantity <= minimum_stock AND stock_quantity > 0)::int
                                                               AS low_stock_products,
        COUNT(*) FILTER (WHERE stock_quantity = 0)::int        AS out_of_stock_products
      FROM products;
    `);

    const data = result.rows[0];

    res.json({
      success: true,
      data: {
        totalProducts:       data.total_products,
        totalStockUnits:     data.total_stock_units,
        totalInventoryValue: parseFloat(data.total_inventory_value),
        lowStockProducts:    data.low_stock_products,
        outOfStockProducts:  data.out_of_stock_products,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/sales
 * Returns monthly sales totals for the last 12 months (for bar/line chart).
 */
const getMonthlySales = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
        DATE_TRUNC('month', created_at)                       AS month_date,
        COALESCE(SUM(total_amount), 0)                        AS total_sales,
        COUNT(*)::int                                          AS order_count
      FROM sales
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month_date ASC;
    `);

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        month:      row.month,
        totalSales: parseFloat(row.total_sales),
        orderCount: row.order_count,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/stock-distribution
 * Returns stock quantities grouped by product category (for pie/donut chart).
 */
const getStockDistribution = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        category,
        SUM(stock_quantity)::int    AS total_stock,
        COUNT(*)::int               AS product_count
      FROM products
      GROUP BY category
      ORDER BY total_stock DESC;
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/top-products
 * Returns the top 10 best-selling products by total quantity sold.
 */
const getTopProducts = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        p.id,
        p.name,
        p.category,
        p.selling_price,
        COALESCE(SUM(si.quantity), 0)::int         AS total_sold,
        COALESCE(SUM(si.subtotal), 0)              AS total_revenue
      FROM products p
      LEFT JOIN sale_items si ON p.id = si.product_id
      GROUP BY p.id, p.name, p.category, p.selling_price
      ORDER BY total_sold DESC
      LIMIT 10;
    `);

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        ...row,
        sellingPrice: parseFloat(row.selling_price),
        totalRevenue: parseFloat(row.total_revenue),
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/recent-sales
 * Returns the 10 most recent sales transactions with their items.
 */
const getRecentSales = async (req, res, next) => {
  try {
    const salesResult = await query(`
      SELECT
        s.id,
        s.total_amount,
        s.created_at,
        COUNT(si.id)::int AS item_count
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 10;
    `);

    res.json({
      success: true,
      data: salesResult.rows.map((row) => ({
        id:          row.id,
        totalAmount: parseFloat(row.total_amount),
        itemCount:   row.item_count,
        createdAt:   row.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/low-stock
 * Returns products with stock at or below their minimum_stock threshold.
 */
const getLowStock = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        id,
        name,
        sku,
        barcode,
        category,
        stock_quantity,
        minimum_stock,
        selling_price,
        supplier,
        image_url,
        CASE
          WHEN stock_quantity = 0       THEN 'out_of_stock'
          WHEN stock_quantity <= minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status
      FROM products
      WHERE stock_quantity <= minimum_stock
      ORDER BY stock_quantity ASC
      LIMIT 20;
    `);

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        ...row,
        sellingPrice: parseFloat(row.selling_price),
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/recent-products
 * Returns the 8 most recently added products.
 */
const getRecentProducts = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        id,
        name,
        sku,
        barcode,
        category,
        stock_quantity,
        selling_price,
        cost_price,
        supplier,
        image_url,
        created_at
      FROM products
      ORDER BY created_at DESC
      LIMIT 8;
    `);

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        ...row,
        sellingPrice: parseFloat(row.selling_price),
        costPrice:    parseFloat(row.cost_price),
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/inventory-summary
 * Returns per-category inventory summary.
 */
const getInventorySummary = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        category,
        COUNT(*)::int                                             AS product_count,
        SUM(stock_quantity)::int                                  AS total_stock,
        COALESCE(SUM(stock_quantity * selling_price), 0)          AS inventory_value,
        COALESCE(AVG(selling_price), 0)                           AS avg_price,
        COUNT(*) FILTER (WHERE stock_quantity = 0)::int           AS out_of_stock,
        COUNT(*) FILTER (WHERE stock_quantity <= minimum_stock AND stock_quantity > 0)::int
                                                                  AS low_stock
      FROM products
      GROUP BY category
      ORDER BY inventory_value DESC;
    `);

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        ...row,
        inventoryValue: parseFloat(row.inventory_value),
        avgPrice:       parseFloat(row.avg_price),
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getMonthlySales,
  getStockDistribution,
  getTopProducts,
  getRecentSales,
  getLowStock,
  getRecentProducts,
  getInventorySummary,
};
