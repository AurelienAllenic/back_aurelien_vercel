const express = require("express");
const app = express();
const PORT = 4000;

app.get("/", (req, res) => {
  res.status(200).json("Welcome to the main route");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;
