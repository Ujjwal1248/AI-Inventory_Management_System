const { query, getClient } = require('../config/database');

/**
 * GET /api/inventory
 * List inventory stock with valuation, search, filters, pagination & aggregate metrics.
 */
const getInventory = async (req, res, next) => {
  try {
    const {
      search = '',
      category = '',
      stockStatus = '',
      sortBy = 'stock_quantity',
      sortOrder = 'ASC',
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    // Allowed sort columns
    const allowedSortColumns = {
      name: 'p.name',
      sku: 'p.sku',
      category: 'p.category',
      stock_quantity: 'p.stock_quantity',
      minimum_stock: 'p.minimum_stock',
      cost_price: 'p.cost_price',
      selling_price: 'p.selling_price',
      cost_valuation: '(p.stock_quantity * p.cost_price)',
      retail_valuation: '(p.stock_quantity * p.selling_price)',
      updated_at: 'p.updated_at',
    };

    const sortColumn = allowedSortColumns[sortBy] || 'p.stock_quantity';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const conditions = [];
    const params = [];

    // Search query
    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      const searchIdx = params.length;
      conditions.push(`(
        p.name ILIKE $${searchIdx} OR
        p.sku ILIKE $${searchIdx} OR
        COALESCE(p.barcode, '') ILIKE $${searchIdx} OR
        COALESCE(p.supplier, '') ILIKE $${searchIdx}
      )`);
    }

    // Category filter
    if (category && category !== 'all' && category.trim() !== '') {
      params.push(category.trim());
      conditions.push(`p.category = $${params.length}`);
    }

    // Stock Status filter
    if (stockStatus && stockStatus !== 'all') {
      if (stockStatus === 'out_of_stock') {
        conditions.push(`p.stock_quantity = 0`);
      } else if (stockStatus === 'low_stock') {
        conditions.push(`p.stock_quantity <= p.minimum_stock AND p.stock_quantity > 0`);
      } else if (stockStatus === 'in_stock') {
        conditions.push(`p.stock_quantity > p.minimum_stock`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Overall summary metrics across the entire inventory (regardless of current page)
    const summaryQuery = `
      SELECT
        COUNT(*)::int AS total_products,
        COALESCE(SUM(p.stock_quantity), 0)::int AS total_units,
        COALESCE(SUM(p.stock_quantity * p.cost_price), 0)::float AS total_cost_valuation,
        COALESCE(SUM(p.stock_quantity * p.selling_price), 0)::float AS total_retail_valuation,
        COUNT(*) FILTER (WHERE p.stock_quantity <= p.minimum_stock AND p.stock_quantity > 0)::int AS low_stock_count,
        COUNT(*) FILTER (WHERE p.stock_quantity = 0)::int AS out_of_stock_count,
        COUNT(*) FILTER (WHERE p.stock_quantity > p.minimum_stock)::int AS healthy_stock_count
      FROM products p;
    `;
    const summaryResult = await query(summaryQuery);
    const summary = summaryResult.rows[0];

    // Filtered count query for pagination
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM products p
      ${whereClause};
    `;
    const countResult = await query(countQuery, params);
    const total = countResult.rows[0].total;

    // Data query
    const dataParams = [...params, limitNum, offset];
    const dataQuery = `
      SELECT
        p.id,
        p.name,
        p.sku,
        p.barcode,
        p.category,
        p.cost_price::float AS cost_price,
        p.selling_price::float AS selling_price,
        p.stock_quantity,
        p.minimum_stock,
        p.supplier,
        p.image_url,
        p.updated_at,
        (p.stock_quantity * p.cost_price)::float AS cost_valuation,
        (p.stock_quantity * p.selling_price)::float AS retail_valuation,
        CASE
          WHEN p.stock_quantity = 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status,
        (p.stock_quantity - p.minimum_stock) AS stock_deficit
      FROM products p
      ${whereClause}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length};
    `;
    const dataResult = await query(dataQuery, dataParams);

    res.json({
      success: true,
      data: dataResult.rows,
      summary: {
        totalProducts: summary.total_products,
        totalUnits: summary.total_units,
        totalCostValuation: summary.total_cost_valuation,
        totalRetailValuation: summary.total_retail_valuation,
        potentialProfit: summary.total_retail_valuation - summary.total_cost_valuation,
        lowStockCount: summary.low_stock_count,
        outOfStockCount: summary.out_of_stock_count,
        healthyStockCount: summary.healthy_stock_count,
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/:productId
 * Single product inventory details + its complete movement history.
 */
const getProductInventory = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!productId || isNaN(parseInt(productId, 10))) {
      return res.status(400).json({ success: false, error: 'Invalid product ID format.' });
    }

    const prodId = parseInt(productId, 10);

    const productResult = await query(
      `
      SELECT
        p.id,
        p.name,
        p.sku,
        p.barcode,
        p.category,
        p.cost_price::float AS cost_price,
        p.selling_price::float AS selling_price,
        p.stock_quantity,
        p.minimum_stock,
        p.supplier,
        p.image_url,
        p.updated_at,
        (p.stock_quantity * p.cost_price)::float AS cost_valuation,
        (p.stock_quantity * p.selling_price)::float AS retail_valuation,
        CASE
          WHEN p.stock_quantity = 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status
      FROM products p
      WHERE p.id = $1;
      `,
      [prodId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found in inventory.' });
    }

    const product = productResult.rows[0];

    // Fetch this product's stock movements
    const movementsResult = await query(
      `
      SELECT
        id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        reason,
        created_at
      FROM stock_movements
      WHERE product_id = $1
      ORDER BY created_at DESC;
      `,
      [prodId]
    );

    product.movements = movementsResult.rows;

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/inventory/adjust
 * Adjust stock level with database transaction and full history record.
 * Business rules enforced:
 * - Stock must not become negative (new_stock >= 0)
 * - Every manual adjustment must be recorded in stock_movements
 * - Update products.stock_quantity
 * - Database transaction (BEGIN...COMMIT / ROLLBACK)
 */
const adjustStock = async (req, res, next) => {
  const client = await getClient();

  try {
    const {
      productId,
      adjustmentType = 'ADD', // 'ADD', 'REMOVE', 'SET'
      movementType, // 'Stock received', 'Stock sold', 'Manual adjustment', 'Stock returned'
      quantity,
      reason,
    } = req.body;

    // Validation
    if (!productId || isNaN(parseInt(productId, 10))) {
      return res.status(400).json({ success: false, error: 'Product ID is required and must be numeric.' });
    }

    const prodId = parseInt(productId, 10);
    const parsedQty = parseInt(quantity, 10);

    if (isNaN(parsedQty) || parsedQty < 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a non-negative integer.',
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Please provide a reason or note for this stock adjustment.',
      });
    }

    // Begin transaction
    await client.query('BEGIN');

    // Lock the product row for update to prevent concurrent race conditions
    const productQuery = await client.query(
      `SELECT id, name, sku, stock_quantity, minimum_stock, cost_price, selling_price
       FROM products
       WHERE id = $1
       FOR UPDATE;`,
      [prodId]
    );

    if (productQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Product not found in inventory.' });
    }

    const product = productQuery.rows[0];
    const previousStock = product.stock_quantity;
    let newStock = previousStock;
    let netDelta = 0;
    let finalMovementType = movementType || 'Manual adjustment';

    // Calculate new stock based on adjustmentType
    if (adjustmentType === 'ADD') {
      netDelta = parsedQty;
      newStock = previousStock + parsedQty;
      if (!movementType) finalMovementType = 'Stock received';
    } else if (adjustmentType === 'REMOVE') {
      netDelta = -parsedQty;
      newStock = previousStock - parsedQty;
      if (!movementType) finalMovementType = 'Manual adjustment';
    } else if (adjustmentType === 'SET') {
      netDelta = parsedQty - previousStock;
      newStock = parsedQty;
      if (!movementType) finalMovementType = 'Manual adjustment';
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Invalid adjustmentType: "${adjustmentType}". Must be ADD, REMOVE, or SET.`,
      });
    }

    // Rule: Stock must NOT become negative
    if (newStock < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Insufficient stock! Current stock is ${previousStock} units; cannot deduct ${parsedQty} units. Stock cannot become negative.`,
      });
    }

    // Update product stock_quantity in database
    await client.query(
      `UPDATE products
       SET stock_quantity = $1, updated_at = NOW()
       WHERE id = $2;`,
      [newStock, prodId]
    );

    // Record in stock_movements
    const movementInsert = await client.query(
      `INSERT INTO stock_movements (
         product_id, movement_type, quantity, previous_stock, new_stock, reason, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, product_id, movement_type, quantity, previous_stock, new_stock, reason, created_at;`,
      [prodId, finalMovementType, netDelta, previousStock, newStock, reason.trim()]
    );

    // Commit transaction
    await client.query('COMMIT');

    const recordedMovement = movementInsert.rows[0];
    const costValuation = newStock * parseFloat(product.cost_price);
    const retailValuation = newStock * parseFloat(product.selling_price);

    res.json({
      success: true,
      message: `Stock for "${product.name}" successfully updated from ${previousStock} to ${newStock} units.`,
      data: {
        productId: prodId,
        productName: product.name,
        sku: product.sku,
        previousStock,
        newStock,
        change: netDelta,
        costValuation,
        retailValuation,
        stockStatus:
          newStock === 0
            ? 'out_of_stock'
            : newStock <= product.minimum_stock
            ? 'low_stock'
            : 'in_stock',
        movement: recordedMovement,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * GET /api/inventory/movements
 * List stock movements across all products with search, movement_type filter, and pagination.
 */
const getStockMovements = async (req, res, next) => {
  try {
    const {
      productId,
      movementType,
      search = '',
      page = 1,
      limit = 15,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (productId && !isNaN(parseInt(productId, 10))) {
      params.push(parseInt(productId, 10));
      conditions.push(`sm.product_id = $${params.length}`);
    }

    if (movementType && movementType !== 'all') {
      params.push(movementType.trim());
      conditions.push(`sm.movement_type = $${params.length}`);
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      const searchIdx = params.length;
      conditions.push(`(
        p.name ILIKE $${searchIdx} OR
        p.sku ILIKE $${searchIdx} OR
        sm.reason ILIKE $${searchIdx}
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      ${whereClause};
    `;
    const countResult = await query(countQuery, params);
    const total = countResult.rows[0].total;

    const dataParams = [...params, limitNum, offset];
    const dataQuery = `
      SELECT
        sm.id,
        sm.product_id,
        p.name AS product_name,
        p.sku,
        p.category,
        p.image_url,
        sm.movement_type,
        sm.quantity,
        sm.previous_stock,
        sm.new_stock,
        sm.reason,
        sm.created_at
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      ${whereClause}
      ORDER BY sm.created_at DESC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length};
    `;
    const dataResult = await query(dataQuery, dataParams);

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/low-stock
 * Dedicated endpoint for low-stock and out-of-stock items needing urgent replenishment.
 */
const getLowStockInventory = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        p.id,
        p.name,
        p.sku,
        p.barcode,
        p.category,
        p.stock_quantity,
        p.minimum_stock,
        (p.minimum_stock - p.stock_quantity) AS units_needed,
        p.cost_price::float AS cost_price,
        p.selling_price::float AS selling_price,
        ((p.minimum_stock - p.stock_quantity) * p.cost_price)::float AS reorder_estimated_cost,
        p.supplier,
        p.image_url,
        CASE
          WHEN p.stock_quantity = 0 THEN 'out_of_stock'
          ELSE 'low_stock'
        END AS stock_status
      FROM products p
      WHERE p.stock_quantity <= p.minimum_stock
      ORDER BY p.stock_quantity ASC, units_needed DESC;
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  getProductInventory,
  adjustStock,
  getStockMovements,
  getLowStockInventory,
};
