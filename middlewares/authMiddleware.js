module.exports = (req, res, next) => {
  try {
    // Vérifie si l'utilisateur est connecté
    if (req.session && req.session.userId) {
      // On peut mettre l'info utilisateur dans req.auth pour rester cohérent
      req.auth = {
        userId: req.session.userId,
        username: req.session.username, // si tu veux stocker le username
      };
      next();
    } else {
      res.status(401).json({ error: "Utilisateur non authentifié" });
    }
  } catch (error) {
    res.status(500).json({ error: "Erreur middleware auth" });
  }
};
