const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { loginLimiter } = require("../middlewares/rateLimiter");

// 🔐 Connexion (avec rate limiter)
router.post("/login", loginLimiter, authController.login);

// 🔓 Déconnexion
router.post("/logout", authController.logout);

// 🧩 Vérifier si une session est active
router.get("/check", authController.checkSession);

// 🆕 (optionnel) Inscription — tu peux la réactiver si tu veux
// router.post("/register", authController.register);

module.exports = router;
