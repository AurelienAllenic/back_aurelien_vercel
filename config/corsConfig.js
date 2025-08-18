const cors = require("cors");

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://aurelienallenic.fr",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://paro-officiel.com",
      "https://paro-musique.com",
    ];

    // Autoriser les requêtes sans origine (comme Postman) ou celles dans allowedOrigins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin || true); // Renvoyer l'origine exacte ou true pour les requêtes sans origine
    } else {
      callback(new Error("CORS policy: Origin not allowed"));
    }
  },
  credentials: true, // Nécessaire pour les cookies ou l'authentification
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Utiliser le middleware cors directement
module.exports = cors(corsOptions);
