const db = require("../models");
const todoService = require("../services/todo.service");
const Todo = db.todos;
const Item = db.items;
const Op = db.Sequelize.Op;

// Create and Save a new Todo with Items
exports.create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.title) {
      return res.status(400).send({
        message: "Title cannot be empty!"
      });
    }

    // Use the service to create Todo with Items
    const result = await todoService.createTodoWithItems(req.body);
    
    return res.status(201).send(result);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Todo."
    });
  }
};

// Retrieve all Todos from the database with pagination and filtering
exports.findAll = async (req, res) => {
  try {
    const { page = 1, size = 10, status, title } = req.query;
    const limit = parseInt(size);
    const offset = (parseInt(page) - 1) * limit;

    let condition = {};
    
    // Filter by status if provided
    if (status) {
      condition.status = status;
    } else {
      // By default, don't show deleted todos
      condition.status = { [Op.ne]: 'DELETED' };
    }
    
    // Filter by title if provided
    if (title) {
      condition.title = { [Op.like]: `%${title}%` };
    }

    const todos = await Todo.findAndCountAll({
      where: condition,
      limit,
      offset,
      include: ["items"],
      distinct: true
    });

    return res.send({
      totalItems: todos.count,
      todos: todos.rows,
      currentPage: parseInt(page),
      totalPages: Math.ceil(todos.count / limit)
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving todos."
    });
  }
};

// Find a single Todo with an id
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;

    const todo = await Todo.findByPk(id, {
      include: ["items"]
    });

    if (!todo || todo.status === 'DELETED') {
      return res.status(404).send({
        message: `Todo with id=${id} was not found.`
      });
    }

    return res.send(todo);
  } catch (err) {
    res.status(500).send({
      message: `Error retrieving Todo with id=${req.params.id}`
    });
  }
};

// Update a Todo by the id in the request
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    const todo = await Todo.findByPk(id);
    
    if (!todo || todo.status === 'DELETED') {
      return res.status(404).send({
        message: `Todo with id=${id} was not found.`
      });
    }

    const [num] = await Todo.update(req.body, {
      where: { id: id }
    });

    if (num === 1) {
      const updatedTodo = await Todo.findByPk(id, {
        include: ["items"]
      });
      
      return res.send({
        message: "Todo was updated successfully.",
        todo: updatedTodo
      });
    } else {
      return res.send({
        message: `Cannot update Todo with id=${id}. Maybe Todo was not found or req.body is empty!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Error updating Todo with id=${req.params.id}`
    });
  }
};

// Soft delete a Todo with the specified id
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const todo = await Todo.findByPk(id);
    
    if (!todo || todo.status === 'DELETED') {
      return res.status(404).send({
        message: `Todo with id=${id} was not found.`
      });
    }

    // Soft delete by updating status to 'DELETED'
    const [num] = await Todo.update({ status: 'DELETED' }, {
      where: { id: id }
    });

    if (num === 1) {
      return res.send({
        message: "Todo was deleted successfully!"
      });
    } else {
      return res.send({
        message: `Cannot delete Todo with id=${id}. Maybe Todo was not found!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Could not delete Todo with id=${req.params.id}`
    });
  }
}; 