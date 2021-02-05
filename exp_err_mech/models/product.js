const { Sequelize, DataTypes, JSONB } = require('sequelize');

const sequelize = require('../util/database');

const Product = sequelize.define('product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  title: DataTypes.STRING, //Remember that for type we dont need to specifically mention.
  price: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Product;
// JSON.stringify()
// (async function() {
//   const jane = await Product.create({
//     title: 'Hello-World',
//     price: 123,
//     imageUrl: '',
//     description: 'Test run'
//   });
// })();
