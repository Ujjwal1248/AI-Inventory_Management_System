const { query } = require('../config/database');

/**
 * GET /api/products
 * List products with search, filtering, sorting, and pagination.
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      search = '',
      category = '',
      stockStatus = '',
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    // Allowed sort columns to prevent SQL injection
    const allowedSortColumns = {
      name: 'p.name',
      category: 'p.category',
      cost_price: 'p.cost_price',
      selling_price: 'p.selling_price',
      stock_quantity: 'p.stock_quantity',
      created_at: 'p.created_at',
      sku: 'p.sku',
    };

    const sortColumn = allowedSortColumns[sortBy] || 'p.created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Build WHERE clauses dynamically
    const conditions = [];
    const params = [];

    // Search filter
    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      const searchIdx = params.length;
      conditions.push(`(
        p.name ILIKE $${searchIdx} OR
        p.sku ILIKE $${searchIdx} OR
        COALESCE(p.barcode, '') ILIKE $${searchIdx} OR
        COALESCE(p.description, '') ILIKE $${searchIdx} OR
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

    // Total count query for pagination
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
        p.description,
        p.cost_price::float AS cost_price,
        p.selling_price::float AS selling_price,
        p.stock_quantity,
        p.minimum_stock,
        p.supplier,
        p.image_url,
        p.created_at,
        p.updated_at,
        CASE
          WHEN p.stock_quantity = 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status,
        (p.selling_price - p.cost_price)::float AS margin,
        ROUND(((p.selling_price - p.cost_price) / NULLIF(p.selling_price, 0) * 100)::numeric, 1)::float AS margin_percent
      FROM products p
      ${whereClause}
      ORDER BY ${sortColumn} ${order}
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
 * GET /api/products/categories
 * Returns list of distinct product categories.
 */
const getCategories = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        category,
        COUNT(*)::int AS count
      FROM products
      GROUP BY category
      ORDER BY category ASC;
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
 * GET /api/products/:id
 * Retrieve a single product by ID with full details & sales summary.
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format.',
      });
    }

    const productResult = await query(
      `
      SELECT
        p.id,
        p.name,
        p.sku,
        p.barcode,
        p.category,
        p.description,
        p.cost_price::float AS cost_price,
        p.selling_price::float AS selling_price,
        p.stock_quantity,
        p.minimum_stock,
        p.supplier,
        p.image_url,
        p.created_at,
        p.updated_at,
        CASE
          WHEN p.stock_quantity = 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status,
        (p.selling_price - p.cost_price)::float AS margin,
        ROUND(((p.selling_price - p.cost_price) / NULLIF(p.selling_price, 0) * 100)::numeric, 1)::float AS margin_percent,
        (p.stock_quantity * p.selling_price)::float AS inventory_value
      FROM products p
      WHERE p.id = $1;
      `,
      [parseInt(id, 10)]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found.',
      });
    }

    const product = productResult.rows[0];

    // Also get sales performance stats for this product
    const salesStats = await query(
      `
      SELECT
        COALESCE(SUM(quantity), 0)::int AS units_sold,
        COALESCE(SUM(subtotal), 0)::float AS total_revenue,
        COUNT(DISTINCT sale_id)::int AS orders_count
      FROM sale_items
      WHERE product_id = $1;
      `,
      [parseInt(id, 10)]
    );

    product.salesStats = salesStats.rows[0];

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products
 * Create a new product.
 */
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      barcode,
      category,
      description,
      cost_price,
      selling_price,
      stock_quantity,
      minimum_stock,
      supplier,
      image_url,
    } = req.body;

    // Field validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Product name is required.' });
    }
    if (!sku || sku.trim() === '') {
      return res.status(400).json({ success: false, error: 'SKU is required.' });
    }
    if (!category || category.trim() === '') {
      return res.status(400).json({ success: false, error: 'Category is required.' });
    }

    const numCost = parseFloat(cost_price);
    const numSelling = parseFloat(selling_price);
    const numStock = parseInt(stock_quantity, 10);
    const numMinStock = parseInt(minimum_stock, 10);

    if (isNaN(numCost) || numCost < 0) {
      return res.status(400).json({ success: false, error: 'Cost price must be a valid non-negative number.' });
    }
    if (isNaN(numSelling) || numSelling < 0) {
      return res.status(400).json({ success: false, error: 'Selling price must be a valid non-negative number.' });
    }
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ success: false, error: 'Stock quantity must be a non-negative integer.' });
    }
    if (isNaN(numMinStock) || numMinStock < 0) {
      return res.status(400).json({ success: false, error: 'Minimum stock must be a non-negative integer.' });
    }

    // Check SKU uniqueness
    const skuCheck = await query('SELECT id FROM products WHERE LOWER(sku) = LOWER($1)', [sku.trim()]);
    if (skuCheck.rows.length > 0) {
      return res.status(409).json({ success: false, error: `A product with SKU "${sku.trim()}" already exists.` });
    }

    // Check Barcode uniqueness if barcode provided
    const cleanBarcode = barcode && barcode.trim() !== '' ? barcode.trim() : null;
    if (cleanBarcode) {
      const barcodeCheck = await query('SELECT id FROM products WHERE barcode = $1', [cleanBarcode]);
      if (barcodeCheck.rows.length > 0) {
        return res.status(409).json({ success: false, error: `A product with Barcode "${cleanBarcode}" already exists.` });
      }
    }

    // Insert new product
    const insertResult = await query(
      `
      INSERT INTO products (
        name, sku, barcode, category, description,
        cost_price, selling_price, stock_quantity, minimum_stock,
        supplier, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING
        id, name, sku, barcode, category, description,
        cost_price::float AS cost_price,
        selling_price::float AS selling_price,
        stock_quantity, minimum_stock, supplier, image_url,
        created_at, updated_at;
      `,
      [
        name.trim(),
        sku.trim(),
        cleanBarcode,
        category.trim(),
        description ? description.trim() : null,
        numCost,
        numSelling,
        numStock,
        numMinStock,
        supplier ? supplier.trim() : 'Direct Supplier',
        image_url ? image_url.trim() : null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: insertResult.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/products/:id
 * Update an existing product.
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({ success: false, error: 'Invalid product ID format.' });
    }

    const prodId = parseInt(id, 10);

    // Verify product exists
    const existing = await query('SELECT id FROM products WHERE id = $1', [prodId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const {
      name,
      sku,
      barcode,
      category,
      description,
      cost_price,
      selling_price,
      stock_quantity,
      minimum_stock,
      supplier,
      image_url,
    } = req.body;

    // Field validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Product name cannot be empty.' });
    }
    if (!sku || sku.trim() === '') {
      return res.status(400).json({ success: false, error: 'SKU cannot be empty.' });
    }
    if (!category || category.trim() === '') {
      return res.status(400).json({ success: false, error: 'Category cannot be empty.' });
    }

    const numCost = parseFloat(cost_price);
    const numSelling = parseFloat(selling_price);
    const numStock = parseInt(stock_quantity, 10);
    const numMinStock = parseInt(minimum_stock, 10);

    if (isNaN(numCost) || numCost < 0) {
      return res.status(400).json({ success: false, error: 'Cost price must be a non-negative number.' });
    }
    if (isNaN(numSelling) || numSelling < 0) {
      return res.status(400).json({ success: false, error: 'Selling price must be a non-negative number.' });
    }
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ success: false, error: 'Stock quantity must be a non-negative integer.' });
    }
    if (isNaN(numMinStock) || numMinStock < 0) {
      return res.status(400).json({ success: false, error: 'Minimum stock must be a non-negative integer.' });
    }

    // Check SKU uniqueness excluding this product
    const skuCheck = await query(
      'SELECT id FROM products WHERE LOWER(sku) = LOWER($1) AND id != $2',
      [sku.trim(), prodId]
    );
    if (skuCheck.rows.length > 0) {
      return res.status(409).json({ success: false, error: `SKU "${sku.trim()}" is already used by another product.` });
    }

    // Check Barcode uniqueness excluding this product
    const cleanBarcode = barcode && barcode.trim() !== '' ? barcode.trim() : null;
    if (cleanBarcode) {
      const barcodeCheck = await query(
        'SELECT id FROM products WHERE barcode = $1 AND id != $2',
        [cleanBarcode, prodId]
      );
      if (barcodeCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: `Barcode "${cleanBarcode}" is already used by another product.`,
        });
      }
    }

    const updateResult = await query(
      `
      UPDATE products
      SET
        name = $1,
        sku = $2,
        barcode = $3,
        category = $4,
        description = $5,
        cost_price = $6,
        selling_price = $7,
        stock_quantity = $8,
        minimum_stock = $9,
        supplier = $10,
        image_url = $11,
        updated_at = NOW()
      WHERE id = $12
      RETURNING
        id, name, sku, barcode, category, description,
        cost_price::float AS cost_price,
        selling_price::float AS selling_price,
        stock_quantity, minimum_stock, supplier, image_url,
        created_at, updated_at,
        CASE
          WHEN stock_quantity = 0 THEN 'out_of_stock'
          WHEN stock_quantity <= minimum_stock THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status;
      `,
      [
        name.trim(),
        sku.trim(),
        cleanBarcode,
        category.trim(),
        description ? description.trim() : null,
        numCost,
        numSelling,
        numStock,
        numMinStock,
        supplier ? supplier.trim() : 'Direct Supplier',
        image_url ? image_url.trim() : null,
        prodId,
      ]
    );

    res.json({
      success: true,
      message: 'Product updated successfully.',
      data: updateResult.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:id
 * Delete a product by ID.
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({ success: false, error: 'Invalid product ID format.' });
    }

    const prodId = parseInt(id, 10);

    const existing = await query('SELECT id, name FROM products WHERE id = $1', [prodId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const productName = existing.rows[0].name;

    await query('DELETE FROM products WHERE id = $1', [prodId]);

    res.json({
      success: true,
      message: `Product "${productName}" was deleted successfully.`,
      deletedId: prodId,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
