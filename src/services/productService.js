const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const { Op } = require('sequelize');

const normalizeImagePaths = (files) => {
  if (!files || files.length === 0) return [];

  return files.map((file) => {
    let normalizedPath = file.path.replace(/\\/g, '/');
    if (!normalizedPath.startsWith('uploads/')) {
      normalizedPath = `uploads/${normalizedPath.split('/').pop()}`;
    }
    return normalizedPath;
  });
};

const getProducts = async (query, baseUrl, path) => {
  let {
    page = 1,
    limit = 10,
    sortBy = 'id',
    order = 'DESC',
    keyword,
    category,
    minPrice,
    maxPrice,
  } = query;

  limit = Math.min(parseInt(limit, 10) || 10, 100);
  page = Math.max(parseInt(page, 10) || 1, 1);
  minPrice = minPrice !== undefined ? parseFloat(minPrice) : undefined;
  maxPrice = maxPrice !== undefined ? parseFloat(maxPrice) : undefined;

  const offset = (page - 1) * limit;
  const allowedSortFields = ['id', 'name', 'price', 'createdAt'];
  if (!allowedSortFields.includes(sortBy)) {
    sortBy = 'id';
  }

  const allowedOrders = ['ASC', 'DESC'];
  order = allowedOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

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
    if (minPrice !== undefined && !Number.isNaN(minPrice)) {
      where.price[Op.gte] = minPrice;
    }
    if (maxPrice !== undefined && !Number.isNaN(maxPrice)) {
      where.price[Op.lte] = maxPrice;
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
    const queryString = new URLSearchParams({ ...query, page: newPage }).toString();
    return `${baseUrl}${path}?${queryString}`;
  };

  return {
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
  };
};

const getProductById = async (id) => {
  const parsedId = parseInt(id, 10);
  if (Number.isNaN(parsedId) || parsedId <= 0) {
    throw new ApiError(400, 'Invalid product ID');
  }

  const product = await Product.findByPk(parsedId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return product;
};

const addProduct = async (productData, files) => {
  const images = normalizeImagePaths(files);
  return Product.create({ ...productData, images });
};

const updateProduct = async (id, productData, files) => {
  const parsedId = parseInt(id, 10);
  if (Number.isNaN(parsedId) || parsedId <= 0) {
    throw new ApiError(400, 'Invalid product ID');
  }

  const product = await Product.findByPk(parsedId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const images = product.images;
  if (files && files.length > 0) {
    productData.images = normalizeImagePaths(files);
  }

  Object.assign(product, productData);
  await product.save();
  return product;
};

const deleteProduct = async (id) => {
  const parsedId = parseInt(id, 10);
  if (Number.isNaN(parsedId) || parsedId <= 0) {
    throw new ApiError(400, 'Invalid product ID');
  }

  const product = await Product.findByPk(parsedId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  await product.destroy();
};

module.exports = {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
};
