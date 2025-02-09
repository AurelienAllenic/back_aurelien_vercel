const express = require("express");
const bodyParser = require("body-parser");
const corsConfig = require("../config/corsConfig");
//const emailRoutes = require("../routes/emailRoutes");
require("dotenv").config();

const app = express();

// Middlewares
app.use(corsConfig);
app.options("*", corsConfig);
app.use(bodyParser.json());

// Routes
//app.use("/api", emailRoutes);

// Test route
app.get("/", (req, res) => {
  console.log("Route / appelée !");
  res.send("Hello World!");
  console.log("✅ Réponse envoyée !");
});

module.exports = app; // Ne pas démarrer le serveur ici
