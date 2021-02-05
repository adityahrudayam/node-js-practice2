const sequelize = require('../util/database');

const { DataTypes } = require('sequelize');

const Cart = sequelize.define('cart', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    }
});

module.exports = Cart;

