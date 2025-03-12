const Press = require("../models/Press");
const cloudinary = require("cloudinary").v2;

// Configurer Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Créer un article de presse
exports.createPress = async (req, res) => {
  try {
    const { link, alt } = req.body;

    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "Aucune image fournie" });
    }

    // Upload de l'image sur Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "press",
    });

    // Gestion du champ `link` vide (on met `null` si absent)
    const press = new Press({
      image: result.secure_url,
      link: link && link.trim() !== "" ? link : null,
      alt,
    });

    await press.save();
    res.status(201).json(press);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtenir un article de presse par ID
exports.getPress = async (req, res) => {
  try {
    const press = await Press.findById(req.params.id);
    if (!press) return res.status(404).json({ error: "Article introuvable" });
    res.json(press);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtenir tous les articles de presse
exports.findAllPress = async (req, res) => {
  try {
    const press = await Press.find();
    res.json(press);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour un article de presse
exports.updatePress = async (req, res) => {
  try {
    const { link, alt } = req.body;
    let updateData = { alt };

    // Si `link` est vide, on met `null`
    updateData.link = link && link.trim() !== "" ? link : null;

    // Gestion de l'image mise à jour sur Cloudinary
    if (req.file && req.file.path) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "press",
      });
      updateData.image = result.secure_url;
    }

    const updatedPress = await Press.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
      }
    );

    if (!updatedPress)
      return res.status(404).json({ error: "Aucun article à mettre à jour" });

    res.json(updatedPress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un article de presse
exports.deletePress = async (req, res) => {
  try {
    const deletedPress = await Press.findByIdAndDelete(req.params.id);
    if (!deletedPress)
      return res.status(404).json({ error: "Aucun article à supprimer" });

    res.json({ message: "Article supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
