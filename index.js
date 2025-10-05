const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
require("dotenv").config();

const connectDB = require("./config/db");
const corsConfig = require("./config/corsConfig");
const limiter = require("./config/rateLimiter");

// --- Import des routes ---
const emailRoutes = require("./routes/emailRoutes");
const counterRoutes = require("./routes/counterRoutes");
const authRoutes = require("./routes/authRoutes");
const paroRoutes = require("./routes/paroRoutes");

// --- Initialisation ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Connexion MongoDB ---
connectDB();

// --- Middlewares globaux ---
app.use(corsConfig);
app.options("*", corsConfig);
app.set("trust proxy", 1);
app.use(limiter);
app.use(bodyParser.json({ limit: "15mb" }));
app.use(bodyParser.urlencoded({ limit: "15mb", extended: true }));

// --- CONFIGURATION DES SESSIONS ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_SECRET_KEY, // ⚡ ton URI réel
      collectionName: "sessions",
    }),

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true si HTTPS
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 jour
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
app.use("/auth", authRoutes);

// --- LANCEMENT DU SERVEUR ---
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

module.exports = app;
