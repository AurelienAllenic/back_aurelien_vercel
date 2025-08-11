const cors = require("cors");

const allowedPatterns = [
  /^https:\/\/(www\.)?aurelienallenic\.fr$/,
  /^https:\/\/(www\.)?paro-officiel\.com$/,
  /^https:\/\/(www\.)?paro-musique\.com$/
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("Origin reçu :", origin);
    if (!origin) {
      // Pas d'origine, autoriser (ex: backend calls)
      callback(null, true);
    } else if (allowedPatterns.some((pattern) => pattern.test(origin))) {
      callback(null, origin);
    } else {
      callback(new Error("CORS policy: Origin not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const corsConfig = (req, res, next) => {
  cors(corsOptions)(req, res, (err) => {
    if (err) {
      // Si erreur CORS, envoyer 403
      res.status(403).send(err.message);
      return;
    }

    // Pour toutes les requêtes, set Access-Control-Allow-Origin avec l'origine validée
    const origin = req.headers.origin;
    if (origin && allowedPatterns.some((pattern) => pattern.test(origin))) {
      console.log("Origin reçu dans req.headers.origin:", req.headers.origin);
      res.header("Access-Control-Allow-Origin", origin);
    }

    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
};

module.exports = corsConfig;
