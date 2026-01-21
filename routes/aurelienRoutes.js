const express = require("express");
const router = express.Router();
const aurelienContactController = require("../controllers/aurelienContactController");

// AURELIEN CONTACT ROUTE
router.post("/aurelien-contact", aurelienContactController.handleAurelienContact);

module.exports = router;
