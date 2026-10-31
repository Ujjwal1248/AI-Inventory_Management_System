/**
 * Global error handling middleware.
 * Catches all errors passed via next(err) and returns a consistent JSON response.
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);

  // PostgreSQL specific errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry - this record already exists.',
      detail: err.detail || null,
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Invalid reference - related record not found.',
      detail: err.detail || null,
    });
  }

  if (err.code === 'ECONNREFUSED' || err.code === '57P03') {
    return res.status(503).json({
      success: false,
      error: 'Database connection failed. Please check your PostgreSQL configuration.',
    });
  }

  // Default server error
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler — catches any undefined route.
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFound };
