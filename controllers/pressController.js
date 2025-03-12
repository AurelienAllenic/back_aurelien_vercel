const Press = require("../models/Press");
const cloudinary = require("cloudinary").v2;

// Configurer Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Créer un single
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

// Obtenir une press (on suppose qu'elle est unique)
exports.getPress = async (req, res) => {
  try {
    const press = await Press.findOne();
    if (!press) return res.status(404).json({ error: "Aucune press trouvé" });
    res.json(press);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// **Nouvelle méthode** : Obtenir toutes les press
exports.findAllPress = async (req, res) => {
  try {
    const press = await Press.find();
    res.json(press);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour un single
exports.updatePress = async (req, res) => {
  try {
    const { link, alt } = req.body;
    let updateData = { link, alt };

    if (req.file && req.file.path) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "press",
      });
      updateData.image = result.secure_url;
    }

    const updatedPress = await Press.findOneAndUpdate({}, updateData, {
      new: true,
    });
    if (!updatedPress)
      return res.status(404).json({ error: "Aucune press à mettre à jour" });

    res.json(updatedPress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un single
exports.deletePress = async (req, res) => {
  try {
    const deletedPress = await Press.findOneAndDelete();
    if (!deletedPress)
      return res.status(404).json({ error: "Aucune press à supprimer" });

    res.json({ message: "Press supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
