const { request, app, createTodo, createItem, cleanDb } = require('./utils');
const db = require('../src/models');

describe('Item API', () => {
  let testTodo;

  beforeEach(async () => {
    await cleanDb();
    // Create a test todo for most item tests
    testTodo = await createTodo({ title: 'Test Todo for Items' });
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const itemData = {
        content: 'Test Item Content',
        isCompleted: false,
        todoId: testTodo.id
      };

      const response = await request(app)
        .post('/api/items')
        .send(itemData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe(itemData.content);
      expect(response.body.isCompleted).toBe(itemData.isCompleted);
      expect(response.body.todoId).toBe(testTodo.id);
      expect(response.body.completedAt).toBeNull();
    });

    it('should create a completed item with completedAt', async () => {
      const itemData = {
        content: 'Completed Item',
        isCompleted: true,
        todoId: testTodo.id
      };

      const response = await request(app)
        .post('/api/items')
        .send(itemData);

      expect(response.status).toBe(201);
      expect(response.body.isCompleted).toBe(true);
      expect(response.body.completedAt).not.toBeNull();
    });

    it('should return 400 if content is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ todoId: testTodo.id });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Content cannot be empty');
    });

    it('should return 400 if todoId is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ content: 'Missing TodoId' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('TodoId is required');
    });

    it('should return 404 if todo not found', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          content: 'Item for non-existent Todo',
          todoId: 9999
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 404 if todo is deleted', async () => {
      const deletedTodo = await createTodo({ status: 'DELETED' });

      const response = await request(app)
        .post('/api/items')
        .send({
          content: 'Item for deleted Todo',
          todoId: deletedTodo.id
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/items/todo/:todoId', () => {
    it('should get all items for a todo', async () => {
      // Create test items
      await Promise.all([
        createItem({ content: 'Item 1', todoId: testTodo.id }),
        createItem({ content: 'Item 2', todoId: testTodo.id }),
        createItem({ content: 'Item 3', todoId: testTodo.id })
      ]);

      const response = await request(app)
        .get(`/api/items/todo/${testTodo.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0].content).toBe('Item 1');
      expect(response.body[1].content).toBe('Item 2');
      expect(response.body[2].content).toBe('Item 3');
    });

    it('should filter items by completion status', async () => {
      // Create test items with different completion status
      await Promise.all([
        createItem({ content: 'Incomplete Item', isCompleted: false, todoId: testTodo.id }),
        createItem({ content: 'Complete Item 1', isCompleted: true, todoId: testTodo.id }),
        createItem({ content: 'Complete Item 2', isCompleted: true, todoId: testTodo.id })
      ]);

      const response = await request(app)
        .get(`/api/items/todo/${testTodo.id}`)
        .query({ isCompleted: 'true' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].content).toBe('Complete Item 1');
      expect(response.body[1].content).toBe('Complete Item 2');
      expect(response.body[0].isCompleted).toBe(true);
      expect(response.body[1].isCompleted).toBe(true);
    });

    it('should return 404 if todo not found', async () => {
      const response = await request(app)
        .get('/api/items/todo/9999');

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 404 if todo is deleted', async () => {
      const deletedTodo = await createTodo({ status: 'DELETED' });

      const response = await request(app)
        .get(`/api/items/todo/${deletedTodo.id}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/items/:id', () => {
    it('should get an item by id', async () => {
      const item = await createItem({ 
        content: 'Item to Find', 
        isCompleted: true,
        todoId: testTodo.id 
      });

      const response = await request(app)
        .get(`/api/items/${item.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(item.id);
      expect(response.body.content).toBe('Item to Find');
      expect(response.body.isCompleted).toBe(true);
      expect(response.body.todoId).toBe(testTodo.id);
      expect(response.body.todo).toHaveProperty('title', 'Test Todo for Items');
    });

    it('should return 404 if item not found', async () => {
      const response = await request(app)
        .get('/api/items/9999');

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 404 if related todo is deleted', async () => {
      // Create a todo, then an item, then delete the todo
      const todoToDelete = await createTodo();
      const item = await createItem({ todoId: todoToDelete.id });
      
      // Soft delete the todo
      await db.todos.update({ status: 'DELETED' }, {
        where: { id: todoToDelete.id }
      });

      const response = await request(app)
        .get(`/api/items/${item.id}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('belongs to a deleted Todo');
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should update an item', async () => {
      const item = await createItem({ 
        content: 'Original Content', 
        isCompleted: false,
        todoId: testTodo.id 
      });

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({
          content: 'Updated Content',
          isCompleted: true
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('updated successfully');
      expect(response.body.item.content).toBe('Updated Content');
      expect(response.body.item.isCompleted).toBe(true);
      expect(response.body.item.completedAt).not.toBeNull();
    });

    it('should update completedAt when setting isCompleted to true', async () => {
      const item = await createItem({ 
        content: 'Not Completed', 
        isCompleted: false,
        todoId: testTodo.id 
      });

      const beforeUpdate = new Date(item.completedAt || null);

      // Wait to ensure completedAt timestamp difference is detectable
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ isCompleted: true });

      expect(response.status).toBe(200);
      expect(response.body.item.isCompleted).toBe(true);
      
      // Check that completedAt was updated to a newer timestamp
      const afterUpdate = new Date(response.body.item.completedAt);
      expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime() || 0);
    });

    it('should clear completedAt when setting isCompleted to false', async () => {
      const item = await createItem({ 
        content: 'Completed Item', 
        isCompleted: true,
        completedAt: new Date(),
        todoId: testTodo.id 
      });

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ isCompleted: false });

      expect(response.status).toBe(200);
      expect(response.body.item.isCompleted).toBe(false);
      expect(response.body.item.completedAt).toBeNull();
    });

    it('should return 404 if item not found', async () => {
      const response = await request(app)
        .put('/api/items/9999')
        .send({ content: 'Updated Content' });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 404 if related todo is deleted', async () => {
      // Create a todo, then an item, then delete the todo
      const todoToDelete = await createTodo();
      const item = await createItem({ todoId: todoToDelete.id });
      
      // Soft delete the todo
      await db.todos.update({ status: 'DELETED' }, {
        where: { id: todoToDelete.id }
      });

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ content: 'Updated Content' });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('belongs to a deleted Todo');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an item', async () => {
      const item = await createItem({ 
        content: 'Item to Delete', 
        todoId: testTodo.id 
      });

      const response = await request(app)
        .delete(`/api/items/${item.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');

      // Verify the item is hard deleted
      const deletedItem = await db.items.findByPk(item.id);
      expect(deletedItem).toBeNull();
    });

    it('should return 404 if item not found', async () => {
      const response = await request(app)
        .delete('/api/items/9999');

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 404 if related todo is deleted', async () => {
      // Create a todo, then an item, then delete the todo
      const todoToDelete = await createTodo();
      const item = await createItem({ todoId: todoToDelete.id });
      
      // Soft delete the todo
      await db.todos.update({ status: 'DELETED' }, {
        where: { id: todoToDelete.id }
      });

      const response = await request(app)
        .delete(`/api/items/${item.id}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('belongs to a deleted Todo');
    });
  });
}); 