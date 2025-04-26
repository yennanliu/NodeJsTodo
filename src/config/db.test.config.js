module.exports = {
  HOST: "localhost",
  USER: "root",
  PASSWORD: "",  // Add your MySQL password here
  DB: "todo_test_db",  // Use a separate test database
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // Disable logging in test environment
  logging: false
}; 