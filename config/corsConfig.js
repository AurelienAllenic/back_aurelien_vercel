const cors = require("cors");

const allowedPatterns = [
  /^https:\/\/(www\.)?aurelienallenic\.fr$/,
  /^https:\/\/(www\.)?paro-officiel\.com$/,
  /^https:\/\/(www\.)?paro-musique\.com$/,
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("Origin reçu :", origin);
    if (!origin) {
      callback(null, true);
    } else if (allowedPatterns.some((pattern) => pattern.test(origin))) {
      callback(null, true); // autorise l'origine
    } else {
      callback(new Error("CORS policy: Origin not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const corsConfig = cors(corsOptions);

module.exports = corsConfig;
