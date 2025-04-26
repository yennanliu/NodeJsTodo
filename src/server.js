const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// Configure CORS
const corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

// Parse requests of content-type - application/json
app.use(bodyParser.json());

// Parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Database
const db = require("./models");

// Initialize database with tables
// In development, you can use force: true to drop and recreate tables on each startup
db.sequelize.sync({ force: true }).then(() => {
  console.log("Drop and re-sync db.");
});

// Simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Todo Application API." });
});

// Include routes
require("./routes/todo.routes")(app);
require("./routes/item.routes")(app);

// Set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
}); 