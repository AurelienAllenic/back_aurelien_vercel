const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const corsConfig = require("./config/corsConfig");
const limiter = require("./config/rateLimiter");
const emailRoutes = require("./routes/emailRoutes");
const counterRoutes = require("./routes/counterRoutes");
const authRoutes = require("./routes/authRoutes");
const paroRoutes = require("./routes/paroRoutes");

require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;
connectDB();

app.use(corsConfig);
app.options("*", corsConfig);
app.use(limiter);
app.use(bodyParser.json({ limit: "15mb" }));
app.use(bodyParser.urlencoded({ limit: "15mb", extended: true }));
app.use(emailRoutes);

app.get("/", (req, res) => {
  res.status(200).json("Welcome to the main route");
});
app.use(counterRoutes);
app.use(emailRoutes);
app.use(paroRoutes);
app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;
