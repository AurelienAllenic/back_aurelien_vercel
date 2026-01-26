const express = require("express");
const router = express.Router();
const passport = require("passport");
const authAurelienController = require("../controllers/authAurelienController");
const { loginLimiter } = require("../middlewares/rateLimiter");

// Charger la stratégie Passport pour Aurelien
require("../config/passportAurelien");

// 🔐 Connexion email/password (avec rate limiter)
router.post("/login", loginLimiter, authAurelienController.login);

// 🔵 Démarrage OAuth Google
router.get(
  "/google",
  passport.authenticate("google-aurelien", {
    scope: ["profile", "email"],
  })
);

// 🔵 Callback OAuth Google
router.get(
  "/google/callback",
  passport.authenticate("google-aurelien", {
    failureRedirect: process.env.AURELIEN_FRONTEND_URL 
      ? `${process.env.AURELIEN_FRONTEND_URL}/login?error=oauth_failed`
      : "http://localhost:5173/login?error=oauth_failed",
    session: false, // On gère la session manuellement dans le controller
  }),
  authAurelienController.googleCallback
);

// 🔓 Déconnexion
router.post("/logout", authAurelienController.logout);

// 🧩 Vérifier si une session est active
router.get("/check", authAurelienController.checkSession);

// 👤 CRÉATION DE COMPTE (ADMIN UNIQUEMENT)
router.post(
  "/create-user",
  authAurelienController.requireAuth,
  authAurelienController.requireAdmin,
  authAurelienController.createUser
);

module.exports = router;
