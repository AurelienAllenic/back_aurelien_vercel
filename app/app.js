const express = require("express");
const bodyParser = require("body-parser");
const corsConfig = require("../config/corsConfig");
const emailRoutes = require("../routes/emailRoutes");
require("dotenv").config();

const app = express();

// Middlewares
app.use(corsConfig);
app.options("*", corsConfig);
app.use(bodyParser.json());

// Routes
app.use("/api", emailRoutes);

// Test route
app.get("/", (req, res) => res.send("Hello World!"));

module.exports = app; // Ne pas démarrer le serveur ici
