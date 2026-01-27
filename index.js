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
const authAurelienRoutes = require("./routes/authAurelienRoutes");
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

// --- SOUS-APP POUR AURELIEN AVEC SESSION SÉPARÉE (MONTÉ AVANT LA SESSION PARO) ---
// Cela permet d'avoir un cookie séparé (aurelien.sid) pour Aurelien
// sans toucher à la configuration Paro
const aurelienApp = express();

// Appliquer les middlewares nécessaires au sous-app
aurelienApp.set("trust proxy", 1);
aurelienApp.use(corsConfig);
aurelienApp.options("*", corsConfig);
aurelienApp.use(bodyParser.json({ limit: "15mb" }));
aurelienApp.use(bodyParser.urlencoded({ limit: "15mb", extended: true }));

// Configuration de session séparée pour Aurelien avec cookie différent
aurelienApp.use(
  session({
    name: "aurelien.sid", // Cookie séparé pour Aurelien
    secret: process.env.SESSION_SECRET || "secret_key",
    resave: true,
    saveUninitialized: false,
    rolling: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_SECRET_KEY,
      collectionName: "sessions_aurelien", // Collection séparée
    }),
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24,
      path: "/",
    },
  })
);

// Passport pour Aurelien
require("./config/passportAurelien"); // ⚙️ stratégie Google pour Aurelien
aurelienApp.use(passport.initialize());
aurelienApp.use(passport.session());

// Middleware de debug pour Aurelien
aurelienApp.use((req, res, next) => {
  if (req.path === "/check" || req.path === "/google/callback") {
    console.log('🍪 [Aurelien Debug] Cookie header:', req.headers.cookie || 'AUCUN');
    console.log('🍪 [Aurelien Debug] Session ID:', req.sessionID);
    console.log('🍪 [Aurelien Debug] Session:', {
      hasSession: !!req.session,
      aurelienUserId: req.session?.aurelienUserId,
      site: req.session?.site,
    });
  }
  next();
});

// Routes Aurelien sur le sous-app
aurelienApp.use("/auth-aurelien", authAurelienRoutes);
aurelienApp.use("/", aurelienRoutes); // Les routes dans aurelienRoutes.js ont déjà le préfixe /aurelien-contact

// Monter le sous-app sur le app principal AVANT la session Paro
app.use(aurelienApp);

// --- CONFIGURATION DES SESSIONS PARO (après le sous-app Aurelien) ---
// Créer le middleware de session Paro
const paroSession = session({
  name: "paro.sid",
  secret: process.env.SESSION_SECRET || "secret_key",
  resave: true,
  saveUninitialized: false,
  rolling: true,
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
  },
});

// Appliquer la session Paro uniquement aux routes qui ne sont pas Aurelien
app.use((req, res, next) => {
  // Si c'est une route Aurelien, passer au suivant sans créer de session Paro
  if (req.path.startsWith('/auth-aurelien') || req.path.startsWith('/aurelien-contact')) {
    return next();
  }
  // Sinon, appliquer la session Paro
  return paroSession(req, res, next);
});

// --- INITIALISATION DE PASSPORT PARO ---
require("./config/passport"); // ⚙️ stratégie Google pour Paro
app.use(passport.initialize());
app.use(passport.session());

// --- ROUTES PARO (non touchées) ---
app.get("/", (req, res) => {
  res.status(200).json("Welcome to the main route");
});

app.use(emailRoutes);
app.use(counterRoutes);
app.use(paroRoutes);
app.use("/auth", authRoutes); // Routes auth pour Paro

// --- LANCEMENT DU SERVEUR ---
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

module.exports = app;
