// Choose the appropriate database config based on environment
const env = process.env.NODE_ENV || 'development';
const dbConfig = env === 'test' 
  ? require("../config/db.test.config.js")
  : require("../config/db.config.js");

const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,
  logging: dbConfig.logging !== false,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.todos = require("./todo.model.js")(sequelize, Sequelize);
db.items = require("./item.model.js")(sequelize, Sequelize);

// Establishing relationships
db.todos.hasMany(db.items, { 
  as: "items",
  onDelete: 'CASCADE'
});
db.items.belongsTo(db.todos, {
  foreignKey: "todoId",
  as: "todo"
});

module.exports = db; 