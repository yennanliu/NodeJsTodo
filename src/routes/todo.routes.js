module.exports = app => {
  const todos = require("../controllers/todo.controller.js");
  const router = require("express").Router();

  // Create a new Todo with Items
  router.post("/", todos.create);

  // Retrieve all Todos (with pagination and filtering)
  router.get("/", todos.findAll);

  // Retrieve a single Todo with id
  router.get("/:id", todos.findOne);

  // Update a Todo with id
  router.put("/:id", todos.update);

  // Delete a Todo with id (soft delete)
  router.delete("/:id", todos.delete);

  app.use("/api/todos", router);
}; 