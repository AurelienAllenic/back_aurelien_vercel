const cors = require("cors");

const allowedOrigins = [
  "https://paro-musique.com",
  "https://www.paro-musique.com",
  "https://paro-officiel.com",
  "https://www.paro-officiel.com",
  "https://aurelienallenic.fr",
  "https://www.aurelienallenic.fr",
];

if (process.env.NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:5173");
  allowedOrigins.push("http://127.0.0.1:5173");
}

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser si origin est undefined (Postman, bookmark, Google)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      // ⚡ Renvoie **l'origine exacte** dans le header
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

module.exports = cors(corsOptions);
