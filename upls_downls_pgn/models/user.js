const { Sequelize, DataTypes } = require('sequelize');

const sequelize = require('../util/database');

const User = sequelize.define('user', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    resetToken: DataTypes.STRING,
    resetTokenExpiration: DataTypes.DATE
    // confirmPassword: {}
});

module.exports = User;