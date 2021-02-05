const sequelize = require('../util/database');

const { DataTypes } = require('sequelize');

const CartItem = sequelize.define('cartItem', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    qty: {
        type: DataTypes.INTEGER,
        // defaultValue: 1,
        // allowNull: false
    }
});

module.exports = CartItem;
