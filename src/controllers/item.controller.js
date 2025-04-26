const db = require("../models");
const Item = db.items;
const Todo = db.todos;
const Op = db.Sequelize.Op;

// Create and Save a new Item
exports.create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.content) {
      return res.status(400).send({
        message: "Content cannot be empty!"
      });
    }

    if (!req.body.todoId) {
      return res.status(400).send({
        message: "TodoId is required!"
      });
    }

    // Check if Todo exists and is not deleted
    const todo = await Todo.findByPk(req.body.todoId);
    
    if (!todo || todo.status === 'DELETED') {
      return res.status(404).send({
        message: `Todo with id=${req.body.todoId} was not found.`
      });
    }

    // Create a Item
    const item = {
      content: req.body.content,
      isCompleted: req.body.isCompleted || false,
      completedAt: req.body.isCompleted ? new Date() : null,
      todoId: req.body.todoId
    };

    // Save Item in the database
    const data = await Item.create(item);
    
    return res.status(201).send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Item."
    });
  }
};

// Find all Items for a specific Todo
exports.findAllByTodoId = async (req, res) => {
  try {
    const todoId = req.params.todoId;
    const { isCompleted } = req.query;
    
    let condition = { todoId: todoId };
    
    // Filter by completion status if provided
    if (isCompleted !== undefined) {
      condition.isCompleted = isCompleted === 'true';
    }

    // Check if Todo exists and is not deleted
    const todo = await Todo.findByPk(todoId);
    
    if (!todo || todo.status === 'DELETED') {
      return res.status(404).send({
        message: `Todo with id=${todoId} was not found.`
      });
    }

    const items = await Item.findAll({
      where: condition
    });

    return res.send(items);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving items."
    });
  }
};

// Find a single Item with an id
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;

    const item = await Item.findByPk(id, {
      include: [{
        model: Todo,
        as: "todo",
        attributes: ['id', 'title', 'subtitle', 'status']
      }]
    });

    if (!item) {
      return res.status(404).send({
        message: `Item with id=${id} was not found.`
      });
    }

    // Check if related Todo is deleted
    if (item.todo && item.todo.status === 'DELETED') {
      return res.status(404).send({
        message: `Item with id=${id} belongs to a deleted Todo.`
      });
    }

    return res.send(item);
  } catch (err) {
    res.status(500).send({
      message: `Error retrieving Item with id=${req.params.id}`
    });
  }
};

// Update a Item by the id in the request
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    // Find the item first
    const item = await Item.findByPk(id, {
      include: [{
        model: Todo,
        as: "todo",
        attributes: ['id', 'status']
      }]
    });
    
    if (!item) {
      return res.status(404).send({
        message: `Item with id=${id} was not found.`
      });
    }

    // Check if related Todo is deleted
    if (item.todo && item.todo.status === 'DELETED') {
      return res.status(404).send({
        message: `Item with id=${id} belongs to a deleted Todo.`
      });
    }

    // Handle completion status change
    const updatedData = { ...req.body };
    
    // If isCompleted is being changed to true, set completedAt
    if (req.body.isCompleted === true && !item.isCompleted) {
      updatedData.completedAt = new Date();
    }
    
    // If isCompleted is being changed to false, clear completedAt
    if (req.body.isCompleted === false && item.isCompleted) {
      updatedData.completedAt = null;
    }

    const [num] = await Item.update(updatedData, {
      where: { id: id }
    });

    if (num === 1) {
      const updatedItem = await Item.findByPk(id);
      
      return res.send({
        message: "Item was updated successfully.",
        item: updatedItem
      });
    } else {
      return res.send({
        message: `Cannot update Item with id=${id}. Maybe Item was not found or req.body is empty!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Error updating Item with id=${req.params.id}`
    });
  }
};

// Delete an Item with the specified id
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    // Find the item first
    const item = await Item.findByPk(id, {
      include: [{
        model: Todo,
        as: "todo",
        attributes: ['id', 'status']
      }]
    });
    
    if (!item) {
      return res.status(404).send({
        message: `Item with id=${id} was not found.`
      });
    }

    // Check if related Todo is deleted
    if (item.todo && item.todo.status === 'DELETED') {
      return res.status(404).send({
        message: `Item with id=${id} belongs to a deleted Todo.`
      });
    }

    // Hard delete the item
    const num = await Item.destroy({
      where: { id: id }
    });

    if (num === 1) {
      return res.send({
        message: "Item was deleted successfully!"
      });
    } else {
      return res.send({
        message: `Cannot delete Item with id=${id}. Maybe Item was not found!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Could not delete Item with id=${req.params.id}`
    });
  }
}; 