module.exports = app => {
  const items = require("../controllers/item.controller.js");
  const router = require("express").Router();

  // Create a new Item
  router.post("/", items.create);

  // Retrieve all Items for a Todo
  router.get("/todo/:todoId", items.findAllByTodoId);

  // Retrieve a single Item with id
  router.get("/:id", items.findOne);

  // Update an Item with id
  router.put("/:id", items.update);

  // Delete an Item with id (hard delete)
  router.delete("/:id", items.delete);

  app.use("/api/items", router);
}; 