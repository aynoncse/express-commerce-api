const User = require('./User');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Product = require('./Product');

const setupAssociations = () => {
  User.hasOne(Cart, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Cart.belongsTo(User, { foreignKey: 'userId' });

  Cart.hasMany(CartItem, { foreignKey: 'cartId', onDelete: 'CASCADE' });
  CartItem.belongsTo(Cart, { foreignKey: 'cartId' });

  CartItem.belongsTo(Product, { foreignKey: 'productId' });
  Product.hasMany(CartItem, { foreignKey: 'productId' });
};

module.exports = setupAssociations;
