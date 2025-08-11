const cors = require("cors");

const allowedPatterns = [
  /^https:\/\/(www\.)?aurelienallenic\.fr$/,
  /^https:\/\/(www\.)?paro-officiel\.com$/,
  /^https:\/\/(www\.)?paro-musique\.com$/
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("Origin reçu :", origin);
    if (!origin || allowedPatterns.some((pattern) => pattern.test(origin))) {
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
};

module.exports = cors(corsOptions);