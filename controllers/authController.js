const User = require("../models/User");
const bcrypt = require("bcryptjs");

// --- INSCRIPTION ---
exports.register = async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Cet utilisateur existe déjà." });
    }

    // Hash sécurisé du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Utilisateur créé avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);
    res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
  }
};

// --- CONNEXION ---
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé." });
    }

    const valid = await bcrypt.compare(password.trim(), user.password);
    if (!valid) {
      return res
        .status(401)
        .json({ error: "Paire username/password incorrecte." });
    }

    // ✅ Création d'une session
    req.session.userId = user._id;
    req.session.username = user.username;

    // Sauvegarder la session
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error("Erreur lors de la sauvegarde de la session :", err);
          return reject(err);
        }
        resolve();
      });
    });

    res.status(200).json({
      message: "Connexion réussie.",
      user: { id: user._id, username: user.username },
    });

  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
};

// --- DÉCONNEXION ---
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erreur lors de la déconnexion :", err);
      return res
        .status(500)
        .json({ message: "Erreur lors de la déconnexion." });
    }

    // Supprimer le cookie de session
    res.clearCookie("paro.sid", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({ message: "Déconnexion réussie." });
  });
};

// --- VÉRIFICATION DE SESSION (au lieu du token JWT) ---
exports.checkSession = (req, res) => {
  if (req.session && req.session.userId) {
    return res.status(200).json({
      isAuthenticated: true,
      user: { id: req.session.userId, username: req.session.username },
    });
  }
  res.status(401).json({ isAuthenticated: false });
};

// --- MIDDLEWARE DE PROTECTION DES ROUTES ---
exports.requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non authentifié." });
  }
  next();
};
