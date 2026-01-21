const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
require("dotenv").config();

const connectDB = require("./config/db");
const { connectDBAurelien } = require("./config/dbAurelien");
const corsConfig = require("./config/corsConfig");
const limiter = require("./config/rateLimiter");

// --- Import des routes ---
const emailRoutes = require("./routes/emailRoutes");
const counterRoutes = require("./routes/counterRoutes");
const authRoutes = require("./routes/authRoutes");
const paroRoutes = require("./routes/paroRoutes");
const aurelienRoutes = require("./routes/aurelienRoutes");

// --- Initialisation ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Connexion MongoDB ---
connectDB();

// --- Connexion MongoDB Aurelien (pour les messages) ---
// Attendre la connexion avec timeout pour ne pas bloquer le démarrage
(async () => {
  try {
    await Promise.race([
      connectDBAurelien(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout connexion Aurelien')), 10000))
    ]);
  } catch (error) {
    console.warn('⚠️ Connexion MongoDB Aurelien non établie au démarrage:', error.message);
    console.warn('⚠️ La connexion sera tentée à la première utilisation');
  }
})();

// --- Middlewares globaux ---
app.set("trust proxy", 1);
// CORS doit être avant le rate limiter pour gérer les requêtes OPTIONS
app.use(corsConfig);
app.options("*", corsConfig);
// Rate limiter - exclure les requêtes OPTIONS (preflight)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return next(); // Skip rate limiter pour OPTIONS
  }
  return limiter(req, res, next);
});
app.use(bodyParser.json({ limit: "15mb" }));
app.use(bodyParser.urlencoded({ limit: "15mb", extended: true }));

// --- CONFIGURATION DES SESSIONS ---
app.use(
  session({
    name: "paro.sid",
    secret: process.env.SESSION_SECRET || "secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_SECRET_KEY,
      collectionName: "sessions",
    }),
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24,
      path: "/",
      partitioned: process.env.NODE_ENV === "production", // ⚡ Support CHIPS pour Chrome
    },
  })
);

// --- INITIALISATION DE PASSPORT ---
require("./config/passport"); // ⚙️ notre stratégie Google
app.use(passport.initialize());
app.use(passport.session());

// --- ROUTES ---
app.get("/", (req, res) => {
  res.status(200).json("Welcome to the main route");
});

app.use(emailRoutes);
app.use(counterRoutes);
app.use(paroRoutes);
app.use(aurelienRoutes);
app.use("/auth", authRoutes);

// --- LANCEMENT DU SERVEUR ---
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

module.exports = app;
