const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

/**
 * Helper: Normalize image paths (convert backslashes to forward slashes)
 * @param {Array} files - Multer file objects (req.files)
 * @returns {Array} Array of normalized image paths (e.g., "uploads/product-123.jpg")
 */
const normalizeImagePaths = (files) => {
  if (!files || files.length === 0) return [];
  return files.map(file => {
    // Convert Windows backslashes to forward slashes
    let normalizedPath = file.path.replace(/\\/g, '/');
    // Ensure path starts with 'uploads/'
    if (!normalizedPath.startsWith('uploads/')) {
      normalizedPath = 'uploads/' + normalizedPath.split('/').pop();
    }
    return normalizedPath;
  });
};


/**
 * Get all products with filtering, sorting, pagination, and search capabilities
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @returns {Promise<Object>} JSON response containing the list of products and pagination info
 * @throws {Error} Error during product retrieval
 */
const getProducts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      sortBy = 'id',
      order = 'DESC',
      keyword,
      category,
      minPrice,
      maxPrice,
    } = req.query;

    limit = Math.min(parseInt(limit) || 10, 100);
    page = Math.max(parseInt(page) || 1, 1);

    minPrice = minPrice !== undefined ? parseFloat(minPrice) : undefined;
    maxPrice = maxPrice !== undefined ? parseFloat(maxPrice) : undefined;

    const offset = (page - 1) * limit;
    const allowedSortFields = ['id', 'name', 'price', 'createdAt'];

    if (!allowedSortFields.includes(sortBy)) {
      sortBy = 'id';
    }
    const allowedOrders = ['ASC', 'DESC'];
    order = allowedOrders.includes(order.toUpperCase())
      ? order.toUpperCase()
      : 'DESC';

    const where = {};

    if (keyword) {
      const sanitizedKeyword = keyword.trim().slice(0, 100);
      if (sanitizedKeyword.length > 0) {
        where.name = { [Op.like]: `%${sanitizedKeyword}%` };
      }
    }

    if (category) {
      where.category = { [Op.eq]: category };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};

      if (minPrice !== undefined && !isNaN(parseFloat(minPrice))) {
        where.price[Op.gte] = parseFloat(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(parseFloat(maxPrice))) {
        where.price[Op.lte] = parseFloat(maxPrice);
      }
    }

    const { rows: products, count: total } = await Product.findAndCountAll({
      where,
      order: [[sortBy, order]],
      limit,
      offset,
    });

    const totalPages = Math.ceil(total / limit);
    const from = products.length > 0 ? (page - 1) * limit + 1 : null;
    const to = products.length > 0 ? from + products.length - 1 : null;

    const buildLink = (newPage) => {
      const query = { ...req.query, page: newPage };
      const queryString = new URLSearchParams(query).toString();
      return `${req.protocol}://${req.get('host')}${req.path}?${queryString}`;
    };

    res.json({
      data: products,
      links: {
        first: buildLink(1),
        last: totalPages > 0 ? buildLink(totalPages) : buildLink(1),
        prev: page > 1 ? buildLink(page - 1) : null,
        next: page < totalPages ? buildLink(page + 1) : null,
      },
      meta: {
        current_page: page,
        from,
        last_page: totalPages,
        per_page: limit,
        to,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);

    // Differentiate error types
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Invalid query parameters' });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get a single product by ID
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @returns {Promise<Object>} JSON response containing the product details
 * @throws {Error} Error during product retrieval
 */
const getProductById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Add a new product to the database
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @returns {Promise<Object>} JSON response containing the added product
 * @throws {Error} Error during product creation
 */
const addProduct = async (req, res) => {
  // check for validation errors
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, price, category, stock } = req.body;
    const images = normalizeImagePaths(req.files);

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      images,
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Invalid product data' });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Product already exists' });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update an existing product by ID
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @returns {Promise<Object>} JSON response containing the updated product details
 * @throws {Error} Error during product update
 */
const updateProduct = async (req, res) => {
  // check for validation errors
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, description, price, category, stock } = req.body;

    let images = product.images;
    if (req.files && req.files.length > 0) {
      images = normalizeImagePaths(req.files);
    }

    // Only update provided fields
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (stock !== undefined) product.stock = stock;
    product.images = images;

    await product.save();

    res.status(200).json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a product by ID
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @returns {Promise<Object>} JSON response containing the deleted product details
 * @throws {Error} Error during product deletion
 */
const deleteProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await product.destroy();
    res.status(204).send(); // No content for successful deletion
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductById,
};
