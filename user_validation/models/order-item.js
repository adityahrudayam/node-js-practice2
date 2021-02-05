const sequelize = require('../util/database');

const { DataTypes } = require('sequelize');

const OrderItem = sequelize.define('orderItem', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    qty: {
        type: DataTypes.INTEGER,
        // allowNull: false
    }
});

module.exports = OrderItem;

