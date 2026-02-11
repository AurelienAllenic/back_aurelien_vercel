const cors = require("cors");

const allowedOrigins = [
  "https://paro-musique.com",
  "https://www.paro-musique.com",
  "https://paro-officiel.com",
  "https://www.paro-officiel.com",
];

// En développement, ajouter localhost
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:5173");
  allowedOrigins.push("http://127.0.0.1:5173");
  allowedOrigins.push("http://localhost:3000");
  allowedOrigins.push("http://127.0.0.1:3000");
}

console.log("🌍 [CORS] Origines autorisées :", allowedOrigins);
console.log("🌍 [CORS] NODE_ENV :", process.env.NODE_ENV || "undefined");

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser si origin est undefined (requêtes serveur-à-serveur, Postman)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy: Origin not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);