const Single = require("../models/Single");
const cloudinary = require("cloudinary").v2;

// Configurer Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Créer un single
exports.createSingle = async (req, res) => {
  try {
    const { link, alt } = req.body;

    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "Aucune image fournie" });
    }

    // Upload de l'image sur Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "singles",
    });

    const single = new Single({
      image: result.secure_url,
      link,
      alt,
    });

    await single.save();
    res.status(201).json(single);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtenir un single (on suppose qu'il est unique)
exports.getSingle = async (req, res) => {
  try {
    const single = await Single.findOne();
    if (!single) return res.status(404).json({ error: "Aucun single trouvé" });
    res.json(single);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// **Nouvelle méthode** : Obtenir tous les singles
exports.findAllSingles = async (req, res) => {
  try {
    const singles = await Single.find();
    res.json(singles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour un single
exports.updateSingle = async (req, res) => {
  try {
    const { link, alt } = req.body;
    let updateData = { link, alt };

    if (req.file && req.file.path) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "singles",
      });
      updateData.image = result.secure_url;
    }

    const updatedSingle = await Single.findOneAndUpdate({}, updateData, {
      new: true,
    });
    if (!updatedSingle)
      return res.status(404).json({ error: "Aucun single à mettre à jour" });

    res.json(updatedSingle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un single
exports.deleteSingle = async (req, res) => {
  try {
    const deletedSingle = await Single.findOneAndDelete();
    if (!deletedSingle)
      return res.status(404).json({ error: "Aucun single à supprimer" });

    res.json({ message: "Single supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
