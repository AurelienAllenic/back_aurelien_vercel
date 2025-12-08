const cors = require("cors");

const allowedOrigins = [
  "https://paro-musique.com",
  "https://www.paro-musique.com",
  "https://paro-officiel.com",
  "https://www.paro-officiel.com",
  "https://aurelienallenic.fr",
  "https://www.aurelienallenic.fr",
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
    console.log("🔍 [CORS] Origine reçue :", origin);
    
    // Autoriser si origin est undefined (requêtes serveur-à-serveur, Postman)
    if (!origin) {
      console.log("✅ [CORS] Origine undefined - autorisée");
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      console.log("✅ [CORS] Origine autorisée :", origin);
      callback(null, true);
    } else {
      console.log("❌ [CORS] Origine REFUSÉE :", origin);
      callback(new Error("CORS policy: Origin not allowed"));
    }
  },
  credentials: true, // ⚡ INDISPENSABLE pour les cookies/sessions
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);