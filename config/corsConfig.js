const cors = require("cors");

const allowedOrigins = [
  "https://paro-musique.com",
  "https://www.paro-musique.com",
  "https://paro-officiel.com",
  "https://www.paro-officiel.com",
  "https://aurelienallenic.fr",
  "https://www.aurelienallenic.fr",
];

// Ajouter localhost uniquement en développement
if (process.env.NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:5173");
  allowedOrigins.push("http://127.0.0.1:5173");
}

const corsOptions = {
  origin: function (origin, callback) {
    console.log("Origin reçu :", origin);

    // Autoriser les requêtes sans origin (ex: bookmarks, liens Google)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      // Ici on renvoie **l’origine exacte** dans Access-Control-Allow-Origin
      callback(null, true);
    } else {
      callback(new Error("CORS policy: Origin not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

module.exports = [
  cors(corsOptions),
  (req, res, next) => {
    // Définir dynamiquement l'origine dans le header si elle est autorisée
    const origin = req.headers.origin;
    if (!origin || allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    }
    res.setHeader("Vary", "Origin"); // pour le cache
    next();
  },
];
