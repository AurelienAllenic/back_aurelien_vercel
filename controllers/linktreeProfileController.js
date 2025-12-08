const LinktreeProfile = require("../models/LinktreeProfile");

// Récupérer le profil Linktree (public)
exports.getProfile = async (req, res) => {
  try {
    let profile = await LinktreeProfile.findOne().lean();
    
    // Si aucun profil n'existe, créer un profil par défaut
    if (!profile) {
      profile = await new LinktreeProfile({
        name: "Paro",
        description: "Musique sans visage",
        profileImage: "/assets/paro_home.jpg",
        socialIcons: []
      }).save();
    }
    
    res.status(200).json(profile);
  } catch (error) {
    console.error("Erreur récupération profil linktree:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Mettre à jour le profil (admin)
exports.updateProfile = async (req, res) => {
  try {
    let profile = await LinktreeProfile.findOne();
    
    if (!profile) {
      profile = new LinktreeProfile(req.body);
    } else {
      Object.assign(profile, req.body);
    }
    
    await profile.save();
    
    res.status(200).json({ 
      success: true, 
      message: "Profil mis à jour", 
      profile 
    });
  } catch (error) {
    console.error("Erreur mise à jour profil:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
};