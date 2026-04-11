const User = require('./User');
const Address = require('./Address');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

const setupAssociations = () => {
  User.hasMany(Address, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Address.belongsTo(User, { foreignKey: 'userId' });

  User.hasOne(Cart, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Cart.belongsTo(User, { foreignKey: 'userId' });

  Cart.hasMany(CartItem, { foreignKey: 'cartId', onDelete: 'CASCADE' });
  CartItem.belongsTo(Cart, { foreignKey: 'cartId' });

  CartItem.belongsTo(Product, { foreignKey: 'productId' });
  Product.hasMany(CartItem, { foreignKey: 'productId' });

  User.hasMany(Order, { foreignKey: 'userId'});
  Order.belongsTo(User, { foreignKey: 'userId' });

  Order.hasMany(OrderItem, { foreignKey: 'orderId' });
  OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

  Product.hasMany(OrderItem, { foreignKey: 'productId' });
  OrderItem.belongsTo(Product, { foreignKey: 'productId' });
};

module.exports = setupAssociations;
