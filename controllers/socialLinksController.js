const SocialLinks = require("../models/SocialLinks");

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
        qobuz: "",
      });
    }
    res.status(200).json(socialLinks);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.updateSocialLinks = async (req, res) => {
  try {
    let socialLinks = await SocialLinks.findOne();

    if (!socialLinks) {
      socialLinks = new SocialLinks(req.body);
    } else {
      Object.assign(socialLinks, req.body);
    }

    await socialLinks.save();
    res.status(200).json({ message: "Liens sociaux mis à jour avec succès !" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};
