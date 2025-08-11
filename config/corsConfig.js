const cors = require("cors");

// Middleware pour forcer la redirection vers la version sans www
const forceNonWWW = (req, res, next) => {
  if (req.hostname === "www.paro-musique.com") {
    return res.redirect(301, "https://paro-musique.com" + req.originalUrl);
  }
  next();
};

const allowedOrigins = [
  "https://aurelienallenic.fr",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://paro-officiel.com",
  /^https:\/\/(www\.)?paro-officiel\.com$/,
  /^https:\/\/(www\.)?paro-musique\.com$/
];

const corsOptions = {
  origin: function (origin, callback) {
    const isAllowed = !origin || allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy: Origin not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const corsConfig = (req, res, next) => {
  cors(corsOptions)(req, res, () => {
    if (req.method === "OPTIONS") {
      const origin = req.headers.origin;
      if (origin && allowedOrigins.some(o =>
        o instanceof RegExp ? o.test(origin) : o === origin
      )) {
        res.header("Access-Control-Allow-Origin", origin);
      }
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
      return res.status(200).send();
    }
    next();
  });
};

module.exports = { corsConfig, forceNonWWW };
