const SocialLinks = require("../models/SocialLinks");

// ✅ Récupérer les liens sociaux (ne nécessite pas d'authentification)
exports.getSocialLinks = async (req, res) => {
  try {
    const socialLinks = await SocialLinks.findOne();
    if (!socialLinks) {
      return res.status(200).json({
        youtube: "",
        instagram: "",
        facebook: "",
        tiktok: "",
        spotify: "",
        deezer: "",
        appleMusic: "",
        amazonMusic: "",
        soundcloud: "",
      }); // Renvoie un objet vide si aucun trouvé
    }
    res.status(200).json(socialLinks);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ✅ Mettre à jour les liens sociaux
exports.updateSocialLinks = async (req, res) => {
  try {
    let socialLinks = await SocialLinks.findOne();

    if (!socialLinks) {
      // Crée un nouvel objet si aucun lien n'existe
      socialLinks = new SocialLinks(req.body);
    } else {
      // Met à jour les liens existants
      Object.assign(socialLinks, req.body);
    }

    await socialLinks.save();
    res.status(200).json({ message: "Liens sociaux mis à jour avec succès !" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};
