const cors = require("cors");

const allowedPatterns = [
  /^https:\/\/(www\.)?aurelienallenic\.fr$/,
  /^https:\/\/(www\.)?paro-officiel\.com$/,
  /^https:\/\/(www\.)?paro-musique\.com$/,
];

// Ajouter localhost uniquement en développement
if (process.env.NODE_ENV === "development") {
  allowedPatterns.push(/^http:\/\/localhost:5173$/);
  allowedPatterns.push(/^http:\/\/127\.0\.0\.1:5173$/);
}

const corsOptions = {
  origin: function (origin, callback) {
    console.log("Origin reçu :", origin);

    // Si origin est undefined (ex: Postman, server-to-server), on autorise
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed = allowedPatterns.some((pattern) => pattern.test(origin));
    if (isAllowed) {
      console.log("Origine autorisée :", origin);
      callback(null, true);
    } else {
      console.log("Origine refusée :", origin);
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
    res.setHeader("Vary", "Origin"); // pour le cache
    next();
  },
];
