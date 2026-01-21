const express = require("express");
const router = express.Router();
const aurelienContactController = require("../controllers/aurelienContactController");
const corsConfig = require("../config/corsConfig");

// Gérer explicitement les requêtes OPTIONS (preflight) pour CORS
router.options("/aurelien-contact", corsConfig);

// AURELIEN CONTACT ROUTE
router.post("/aurelien-contact", aurelienContactController.handleAurelienContact);

module.exports = router;
