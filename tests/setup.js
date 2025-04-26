const db = require('../src/models');

// Setup test database
beforeAll(async () => {
  // Sync database with force: true to recreate tables for each test run
  await db.sequelize.sync({ force: true });
});

// Clean up and close database connections after tests
afterAll(async () => {
  await db.sequelize.close();
}); 