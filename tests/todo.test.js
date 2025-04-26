const { request, app, createTodo, createItem, cleanDb } = require('./utils');
const db = require('../src/models');

describe('Todo API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const todoData = {
        title: 'Test Todo',
        subtitle: 'Test Subtitle',
        status: 'ACTIVE'
      };

      const response = await request(app)
        .post('/api/todos')
        .send(todoData);

      expect(response.status).toBe(201);
      expect(response.body.todo).toHaveProperty('id');
      expect(response.body.todo.title).toBe(todoData.title);
      expect(response.body.todo.subtitle).toBe(todoData.subtitle);
      expect(response.body.todo.status).toBe(todoData.status);
    });

    it('should create a todo with items', async () => {
      const todoData = {
        title: 'Todo with Items',
        subtitle: 'Test with Items',
        items: [
          { content: 'Item 1', isCompleted: false },
          { content: 'Item 2', isCompleted: true }
        ]
      };

      const response = await request(app)
        .post('/api/todos')
        .send(todoData);

      expect(response.status).toBe(201);
      expect(response.body.todo).toHaveProperty('id');
      expect(response.body.todo.items).toHaveLength(2);
      expect(response.body.todo.items[0].content).toBe('Item 1');
      expect(response.body.todo.items[1].content).toBe('Item 2');
      expect(response.body.todo.items[1].isCompleted).toBe(true);
      expect(response.body.todo.items[1]).toHaveProperty('completedAt');
    });

    it('should return 400 if title is missing', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ subtitle: 'Missing Title' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Title cannot be empty');
    });
  });

  describe('GET /api/todos', () => {
    it('should get all todos with pagination', async () => {
      // Create 5 todos
      await Promise.all([
        createTodo({ title: 'Todo 1' }),
        createTodo({ title: 'Todo 2' }),
        createTodo({ title: 'Todo 3' }),
        createTodo({ title: 'Todo 4' }),
        createTodo({ title: 'Todo 5' })
      ]);

      const response = await request(app)
        .get('/api/todos')
        .query({ page: 1, size: 3 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('todos');
      expect(response.body.todos).toHaveLength(3);
      expect(response.body.totalItems).toBe(5);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalPages).toBe(2);
    });

    it('should filter todos by status', async () => {
      await Promise.all([
        createTodo({ title: 'Active Todo', status: 'ACTIVE' }),
        createTodo({ title: 'Inactive Todo', status: 'INACTIVE' }),
        createTodo({ title: 'Deleted Todo', status: 'DELETED' })
      ]);

      const response = await request(app)
        .get('/api/todos')
        .query({ status: 'ACTIVE' });

      expect(response.status).toBe(200);
      expect(response.body.todos).toHaveLength(1);
      expect(response.body.todos[0].title).toBe('Active Todo');
    });

    it('should filter todos by title', async () => {
      await Promise.all([
        createTodo({ title: 'Shopping List' }),
        createTodo({ title: 'Work Tasks' }),
        createTodo({ title: 'Shopping Ideas' })
      ]);

      const response = await request(app)
        .get('/api/todos')
        .query({ title: 'Shopping' });

      expect(response.status).toBe(200);
      expect(response.body.todos).toHaveLength(2);
      expect(response.body.todos[0].title).toContain('Shopping');
      expect(response.body.todos[1].title).toContain('Shopping');
    });
  });

  describe('GET /api/todos/:id', () => {
    it('should get a todo by id with its items', async () => {
      const todo = await createTodo({ title: 'Todo with Items' });
      await Promise.all([
        createItem({ content: 'Item 1', todoId: todo.id }),
        createItem({ content: 'Item 2', todoId: todo.id })
      ]);

      const response = await request(app)
        .get(`/api/todos/${todo.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(todo.id);
      expect(response.body.title).toBe('Todo with Items');
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0].content).toBe('Item 1');
      expect(response.body.items[1].content).toBe('Item 2');
    });

    it('should return 404 if todo not found', async () => {
      const response = await request(app)
        .get('/api/todos/9999');

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 404 if todo is deleted', async () => {
      const todo = await createTodo({ status: 'DELETED' });

      const response = await request(app)
        .get(`/api/todos/${todo.id}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('should update a todo', async () => {
      const todo = await createTodo({ title: 'Original Title' });

      const response = await request(app)
        .put(`/api/todos/${todo.id}`)
        .send({
          title: 'Updated Title',
          subtitle: 'Updated Subtitle',
          status: 'INACTIVE'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('updated successfully');
      expect(response.body.todo.title).toBe('Updated Title');
      expect(response.body.todo.subtitle).toBe('Updated Subtitle');
      expect(response.body.todo.status).toBe('INACTIVE');
    });

    it('should return 404 if todo not found', async () => {
      const response = await request(app)
        .put('/api/todos/9999')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 404 if todo is deleted', async () => {
      const todo = await createTodo({ status: 'DELETED' });

      const response = await request(app)
        .put(`/api/todos/${todo.id}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('should soft delete a todo', async () => {
      const todo = await createTodo({ title: 'Todo to Delete' });

      const response = await request(app)
        .delete(`/api/todos/${todo.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');

      // Verify the todo is soft deleted
      const deletedTodo = await db.todos.findByPk(todo.id);
      expect(deletedTodo.status).toBe('DELETED');
    });

    it('should return 404 if todo not found', async () => {
      const response = await request(app)
        .delete('/api/todos/9999');

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 404 if todo is already deleted', async () => {
      const todo = await createTodo({ status: 'DELETED' });

      const response = await request(app)
        .delete(`/api/todos/${todo.id}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });
}); 