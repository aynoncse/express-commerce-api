const { validateRequest, asyncHandler } = require('../utils/controllerUtils');
const productService = require('../services/productService');

const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getProducts(
    req.query,
    `${req.protocol}://${req.get('host')}`,
    req.path,
  );
  res.json(result);
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.json(product);
});

const addProduct = asyncHandler(async (req, res) => {
  validateRequest(req);

  const product = await productService.addProduct(req.body, req.files);
  res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  validateRequest(req);

  const product = await productService.updateProduct(req.params.id, req.body, req.files);
  res.status(200).json(product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.status(204).send();
});

module.exports = {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductById,
};
