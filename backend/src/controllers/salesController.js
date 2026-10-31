const { query, getClient } = require('../config/database');

/**
 * GET /api/pos/products
 * Optimized product search for the POS screen & barcode scanners.
 */
const getPosProducts = async (req, res, next) => {
  try {
    const { search = '', barcode = '', category = '', inStockOnly = 'false' } = req.query;

    const conditions = [];
    const params = [];

    // Exact barcode match (scanner prioritize)
    if (barcode && barcode.trim() !== '') {
      params.push(barcode.trim());
      conditions.push(`p.barcode = $${params.length}`);
    } else if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      const searchIdx = params.length;
      conditions.push(`(
        p.name ILIKE $${searchIdx} OR
        p.sku ILIKE $${searchIdx} OR
        COALESCE(p.barcode, '') ILIKE $${searchIdx}
      )`);
    }

    if (category && category !== 'all' && category.trim() !== '') {
      params.push(category.trim());
      conditions.push(`p.category = $${params.length}`);
    }

    if (inStockOnly === 'true') {
      conditions.push(`p.stock_quantity > 0`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        p.id,
        p.name,
        p.sku,
        p.barcode,
        p.category,
        p.selling_price::float AS selling_price,
        p.cost_price::float AS cost_price,
        p.stock_quantity,
        p.minimum_stock,
        p.image_url,
        CASE
          WHEN p.stock_quantity = 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status
      FROM products p
      ${whereClause}
      ORDER BY p.stock_quantity > 0 DESC, p.name ASC
      LIMIT 50;
    `;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sales
 * Complete a retail sale transaction.
 * Strictly enforces:
 * 1. Validate cart items.
 * 2. Validate stock availability (FOR UPDATE).
 * 3. Calculate total on backend (never trust client prices).
 * 4. Create sale record with receipt number.
 * 5. Create sale_items.
 * 6. Deduct product stock.
 * 7. Record stock_movements ('Stock sold').
 * 8. Commit atomic transaction (or ROLLBACK on failure).
 */
const createSale = async (req, res, next) => {
  const client = await getClient();

  try {
    const { items, paymentMethod = 'Cash', customerName = 'Walk-in Customer' } = req.body;

    // 1. Validate cart items input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Sale must contain at least one product item.',
      });
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const pid = parseInt(item.productId, 10);
      const qty = parseInt(item.quantity, 10);
      if (isNaN(pid) || pid <= 0) {
        return res.status(400).json({
          success: false,
          error: `Item at index ${i} has an invalid product ID.`,
        });
      }
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          error: `Item "${item.productId}" must have a positive quantity (got ${item.quantity}).`,
        });
      }
    }

    // Begin atomic transaction
    await client.query('BEGIN');

    let totalAmount = 0;
    const validatedLines = [];

    // 2. Validate stock availability & compute authentic backend price
    for (const item of items) {
      const prodId = parseInt(item.productId, 10);
      const reqQty = parseInt(item.quantity, 10);

      // Lock product row to prevent concurrent race conditions
      const prodRes = await client.query(
        `SELECT id, name, sku, barcode, category, stock_quantity, selling_price, image_url
         FROM products
         WHERE id = $1
         FOR UPDATE;`,
        [prodId]
      );

      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: `Product with ID ${prodId} was not found.`,
        });
      }

      const prod = prodRes.rows[0];
      const currentStock = prod.stock_quantity;

      // Business rule: Stock must not become negative
      if (currentStock < reqQty) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for "${prod.name}" (SKU: ${prod.sku}). Available: ${currentStock} units, requested: ${reqQty} units.`,
          availableStock: currentStock,
          requestedQuantity: reqQty,
          productId: prodId,
        });
      }

      // Backend price calculation
      const unitPrice = parseFloat(prod.selling_price);
      const lineSubtotal = unitPrice * reqQty;
      totalAmount += lineSubtotal;

      validatedLines.push({
        product: prod,
        quantity: reqQty,
        unitPrice,
        subtotal: lineSubtotal,
        previousStock: currentStock,
        newStock: currentStock - reqQty,
      });
    }

    // 3. Generate unique human-readable receipt number
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const receiptNumber = `REC-${timestamp}${randomSuffix}`;

    // 4. Create sale record
    const saleInsert = await client.query(
      `INSERT INTO sales (receipt_number, total_amount, payment_method, customer_name, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, receipt_number, total_amount::float AS total_amount, payment_method, customer_name, created_at;`,
      [receiptNumber, totalAmount, paymentMethod || 'Cash', (customerName || 'Walk-in Customer').trim()]
    );

    const createdSale = saleInsert.rows[0];
    const saleId = createdSale.id;

    // 5. Create sale items, deduct stock, and record stock movements
    const createdItems = [];

    for (const line of validatedLines) {
      // 5a. Create sale_item
      const itemInsert = await client.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)
         RETURNING id, sale_id, product_id, quantity, unit_price::float AS unit_price, subtotal::float AS subtotal;`,
        [saleId, line.product.id, line.quantity, line.unitPrice]
      );

      createdItems.push({
        ...itemInsert.rows[0],
        productName: line.product.name,
        sku: line.product.sku,
        barcode: line.product.barcode,
        image_url: line.product.image_url,
      });

      // 5b. Deduct product stock
      await client.query(
        `UPDATE products
         SET stock_quantity = $1, updated_at = NOW()
         WHERE id = $2;`,
        [line.newStock, line.product.id]
      );

      // 5c. Record stock movement
      await client.query(
        `INSERT INTO stock_movements (
           product_id, movement_type, quantity, previous_stock, new_stock, reason, created_at
         ) VALUES ($1, 'Stock sold', $2, $3, $4, $5, NOW());`,
        [
          line.product.id,
          -line.quantity,
          line.previousStock,
          line.newStock,
          `POS Sale #${receiptNumber}`,
        ]
      );
    }

    // 6. Commit transaction
    await client.query('COMMIT');

    // Return complete sale receipt data
    res.status(201).json({
      success: true,
      message: `Sale completed successfully! Receipt: ${receiptNumber}`,
      data: {
        ...createdSale,
        items: createdItems,
        itemCount: createdItems.length,
        totalUnits: createdItems.reduce((acc, it) => acc + it.quantity, 0),
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
 * GET /api/sales
 * List completed sales transactions with pagination & filtering.
 */
const getSales = async (req, res, next) => {
  try {
    const {
      search = '',
      paymentMethod = '',
      startDate = '',
      endDate = '',
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      const searchIdx = params.length;
      conditions.push(`(
        COALESCE(s.receipt_number, '') ILIKE $${searchIdx} OR
        COALESCE(s.customer_name, '') ILIKE $${searchIdx} OR
        CAST(s.id AS TEXT) ILIKE $${searchIdx}
      )`);
    }

    if (paymentMethod && paymentMethod !== 'all' && paymentMethod.trim() !== '') {
      params.push(paymentMethod.trim());
      conditions.push(`s.payment_method = $${params.length}`);
    }

    if (startDate && startDate.trim() !== '') {
      params.push(startDate.trim());
      conditions.push(`s.created_at >= $${params.length}::timestamptz`);
    }

    if (endDate && endDate.trim() !== '') {
      params.push(endDate.trim());
      conditions.push(`s.created_at <= $${params.length}::timestamptz`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSort = {
      created_at: 's.created_at',
      total_amount: 's.total_amount',
      id: 's.id',
    };
    const sortCol = allowedSort[sortBy] || 's.created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Summary metrics across sales
    const summaryResult = await query(`
      SELECT
        COUNT(*)::int AS total_sales,
        COALESCE(SUM(total_amount), 0)::float AS total_revenue,
        COALESCE(AVG(total_amount), 0)::float AS avg_ticket_size
      FROM sales;
    `);

    // Total count for pagination
    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM sales s ${whereClause};`,
      params
    );
    const total = countResult.rows[0].total;

    // Sales data query with item count aggregation
    const dataParams = [...params, limitNum, offset];
    const dataQuery = `
      SELECT
        s.id,
        COALESCE(s.receipt_number, 'REC-' || LPAD(s.id::text, 6, '0')) AS receipt_number,
        s.total_amount::float AS total_amount,
        COALESCE(s.payment_method, 'Cash') AS payment_method,
        COALESCE(s.customer_name, 'Walk-in Customer') AS customer_name,
        s.created_at,
        COUNT(si.id)::int AS item_count,
        COALESCE(SUM(si.quantity), 0)::int AS total_units
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      ${whereClause}
      GROUP BY s.id
      ORDER BY ${sortCol} ${order}
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length};
    `;

    const dataResult = await query(dataQuery, dataParams);

    res.json({
      success: true,
      data: dataResult.rows,
      summary: summaryResult.rows[0],
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
 * GET /api/sales/:id
 * Retrieve a single sale with its full items receipt breakdown.
 */
const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({ success: false, error: 'Invalid sale ID format.' });
    }

    const saleId = parseInt(id, 10);

    const saleRes = await query(
      `SELECT
         s.id,
         COALESCE(s.receipt_number, 'REC-' || LPAD(s.id::text, 6, '0')) AS receipt_number,
         s.total_amount::float AS total_amount,
         COALESCE(s.payment_method, 'Cash') AS payment_method,
         COALESCE(s.customer_name, 'Walk-in Customer') AS customer_name,
         s.created_at
       FROM sales s
       WHERE s.id = $1;`,
      [saleId]
    );

    if (saleRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Sale record not found.' });
    }

    const sale = saleRes.rows[0];

    // Fetch line items
    const itemsRes = await query(
      `SELECT
         si.id,
         si.product_id,
         p.name AS product_name,
         p.sku,
         p.barcode,
         p.category,
         p.image_url,
         si.quantity,
         si.unit_price::float AS unit_price,
         si.subtotal::float AS subtotal
       FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = $1
       ORDER BY si.id ASC;`,
      [saleId]
    );

    sale.items = itemsRes.rows;
    sale.totalUnits = itemsRes.rows.reduce((acc, it) => acc + it.quantity, 0);

    res.json({
      success: true,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosProducts,
  createSale,
  getSales,
  getSaleById,
};
