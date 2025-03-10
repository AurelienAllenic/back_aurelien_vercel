const SocialLinks = require("../models/SocialLinks");

// ✅ Récupérer les liens sociaux (public, sans authentification)
exports.getSocialLinks = async (req, res) => {
  try {
    const socialLinks = await SocialLinks.findOne(); // On récupère les liens sociaux globaux

    if (!socialLinks) {
      return res.status(404).json({ message: "Aucun lien social trouvé" });
    }

    res.status(200).json(socialLinks);
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des liens sociaux :",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ✅ Modifier les liens sociaux (auth requis)
exports.updateSocialLinks = async (req, res) => {
  try {
    const {
      youtube,
      instagram,
      facebook,
      tiktok,
      spotify,
      deezer,
      appleMusic,
      amazonMusic,
      soundcloud,
    } = req.body;

    const updatedLinks = await SocialLinks.findOneAndUpdate(
      {}, // On met à jour le seul document existant
      {
        youtube,
        instagram,
        facebook,
        tiktok,
        spotify,
        deezer,
        appleMusic,
        amazonMusic,
        soundcloud,
      },
      { new: true, upsert: true } // `upsert: true` crée le document s'il n'existe pas encore
    );

    res.status(200).json(updatedLinks);
  } catch (error) {
    console.error(
      "❌ Erreur lors de la mise à jour des liens sociaux :",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
};
