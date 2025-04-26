const request = require('supertest');
const app = require('../src/server');
const db = require('../src/models');

/**
 * Create a Todo for testing
 * @param {Object} todoData - Todo data
 */
const createTodo = async (todoData = {}) => {
  const defaultTodo = {
    title: 'Test Todo',
    subtitle: 'Test Subtitle',
    status: 'ACTIVE'
  };

  const mergedData = { ...defaultTodo, ...todoData };
  return await db.todos.create(mergedData);
};

/**
 * Create an Item for testing
 * @param {Object} itemData - Item data
 */
const createItem = async (itemData = {}) => {
  // We need a todoId, so if not provided, create a todo
  if (!itemData.todoId) {
    const todo = await createTodo();
    itemData.todoId = todo.id;
  }

  const defaultItem = {
    content: 'Test Item Content',
    isCompleted: false
  };

  const mergedData = { ...defaultItem, ...itemData };
  return await db.items.create(mergedData);
};

/**
 * Clean up database tables
 */
const cleanDb = async () => {
  await db.items.destroy({ where: {}, force: true });
  await db.todos.destroy({ where: {}, force: true });
};

module.exports = {
  createTodo,
  createItem,
  cleanDb,
  request,
  app
}; 