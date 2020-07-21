const Sequelize = require('sequelize');
const sequelize = new Sequelize('node_complete', 'root', '5001000bnd', {
    dialect: 'mysql',
    host: 'localhost'
});

module.exports = sequelize;