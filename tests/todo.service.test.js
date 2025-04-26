const todoService = require('../src/services/todo.service');
const db = require('../src/models');
const { cleanDb } = require('./utils');

describe('Todo Service', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('createTodoWithItems', () => {
    it('should create a todo without items', async () => {
      const todoData = {
        title: 'Test Todo',
        subtitle: 'Test Subtitle',
        status: 'ACTIVE'
      };

      const result = await todoService.createTodoWithItems(todoData);

      expect(result.todo).toHaveProperty('id');
      expect(result.todo.title).toBe(todoData.title);
      expect(result.todo.subtitle).toBe(todoData.subtitle);
      expect(result.todo.status).toBe(todoData.status);
      expect(result.todo.items).toHaveLength(0);

      // Verify todo is in the database
      const savedTodo = await db.todos.findByPk(result.todo.id);
      expect(savedTodo).not.toBeNull();
      expect(savedTodo.title).toBe(todoData.title);
    });

    it('should create a todo with multiple items', async () => {
      const todoData = {
        title: 'Todo with Items',
        subtitle: 'Test with Items',
        items: [
          { content: 'Item 1', isCompleted: false },
          { content: 'Item 2', isCompleted: true }
        ]
      };

      const result = await todoService.createTodoWithItems(todoData);

      expect(result.todo).toHaveProperty('id');
      expect(result.todo.title).toBe(todoData.title);
      expect(result.todo.items).toHaveLength(2);
      
      // Verify todo items
      expect(result.todo.items[0].content).toBe('Item 1');
      expect(result.todo.items[0].isCompleted).toBe(false);
      expect(result.todo.items[0].completedAt).toBeNull();
      
      expect(result.todo.items[1].content).toBe('Item 2');
      expect(result.todo.items[1].isCompleted).toBe(true);
      expect(result.todo.items[1].completedAt).not.toBeNull();

      // Verify items are in the database
      const savedItems = await db.items.findAll({
        where: { todoId: result.todo.id }
      });
      expect(savedItems).toHaveLength(2);
    });

    it('should throw an error if title is missing', async () => {
      const todoData = {
        subtitle: 'Missing Title'
      };

      await expect(todoService.createTodoWithItems(todoData))
        .rejects.toThrow('Title cannot be empty');
    });

    it('should handle invalid item data and rollback transaction', async () => {
      // First, count existing todos to verify none are added after test
      const initialTodoCount = await db.todos.count();
      
      // Create a todo with an invalid item (missing required content)
      const todoData = {
        title: 'Todo with Invalid Item',
        items: [
          { isCompleted: false } // Missing required 'content' field
        ]
      };

      // Service should throw an error and rollback
      await expect(todoService.createTodoWithItems(todoData))
        .rejects.toThrow();

      // Verify no todos were added (transaction rolled back)
      const finalTodoCount = await db.todos.count();
      expect(finalTodoCount).toBe(initialTodoCount);
    });

    it('should use default values for missing optional fields', async () => {
      const todoData = {
        title: 'Minimal Todo' // Only provide required field
      };

      const result = await todoService.createTodoWithItems(todoData);

      expect(result.todo.title).toBe('Minimal Todo');
      expect(result.todo.subtitle).toBeNull(); // Default is null
      expect(result.todo.status).toBe('ACTIVE'); // Default is 'ACTIVE'
    });
  });
}); 