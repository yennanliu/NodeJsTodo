const db = require("../models");
const Todo = db.todos;
const Item = db.items;
const sequelize = db.sequelize;

/**
 * Service to create a Todo with multiple Items in a transaction
 */
exports.createTodoWithItems = async (data) => {
  // Start a transaction
  const t = await sequelize.transaction();

  try {
    // Validate request
    if (!data.title) {
      throw new Error("Title cannot be empty!");
    }

    // Create a Todo
    const todoData = {
      title: data.title,
      subtitle: data.subtitle || null,
      status: data.status || 'ACTIVE'
    };

    // Save Todo in the database
    const todo = await Todo.create(todoData, { transaction: t });

    // Create items if provided
    let createdItems = [];
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      const itemsData = data.items.map(item => ({
        content: item.content,
        isCompleted: item.isCompleted || false,
        completedAt: item.isCompleted ? new Date() : null,
        todoId: todo.id
      }));

      createdItems = await Item.bulkCreate(itemsData, { transaction: t });
    }

    // Commit the transaction
    await t.commit();

    // Return created todo with items
    return {
      todo: {
        ...todo.toJSON(),
        items: createdItems
      }
    };
  } catch (error) {
    // If an error occurs, rollback the transaction
    await t.rollback();
    throw error;
  }
}; 