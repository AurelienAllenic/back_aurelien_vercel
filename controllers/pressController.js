const mongoose = require("mongoose");
const Press = require("../models/Press");
const cloudinary = require("cloudinary").v2;

// Configurer Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// **Créer un article de presse avec un ordre**
exports.createPress = async (req, res) => {
  try {
    const { link, alt } = req.body;
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "Aucune image fournie" });
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "press",
    });
    const lastPress = await Press.findOne().sort({ order: -1 });
    const newOrder = lastPress ? lastPress.order + 1 : 0;
    const press = new Press({
      image: result.secure_url,
      link: link && link.trim() !== "" ? link : null,
      alt,
      order: newOrder,
    });
    await press.save();
    res.status(201).json(press);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// **Obtenir un article de presse par ID**
exports.getPress = async (req, res) => {
  try {
    console.log("Requête getPress avec ID :", req.params.id);
    const press = await Press.findById(req.params.id);
    if (!press) return res.status(404).json({ error: "Article introuvable" });
    res.json(press);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// **Obtenir tous les articles de presse triés par ordre**
exports.findAllPress = async (req, res) => {
  try {
    const press = await Press.find().sort({ order: 1 });
    res.json(press);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// **Mettre à jour un article de presse**
exports.updatePress = async (req, res) => {
  try {
    const { link, alt } = req.body;
    let updateData = { alt };
    updateData.link = link && link.trim() !== "" ? link : null;
    if (req.file && req.file.path) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "press",
      });
      updateData.image = result.secure_url;
    }
    const updatedPress = await Press.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!updatedPress)
      return res.status(404).json({ error: "Aucun article à mettre à jour" });
    res.json(updatedPress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// **Mettre à jour l'ordre des articles**
exports.updateOrder = async (req, res) => {
  try {
    const { orderedPress } = req.body;
    console.log("Données reçues par /press/order :", orderedPress);

    // Vérifie que orderedPress est un tableau
    if (!Array.isArray(orderedPress)) {
      return res
        .status(400)
        .json({ error: "orderedPress doit être un tableau" });
    }

    // Met à jour chaque article individuellement
    for (const press of orderedPress) {
      const { _id, order } = press;

      // Validation stricte de _id
      if (
        !_id ||
        typeof _id !== "string" ||
        !mongoose.Types.ObjectId.isValid(_id)
      ) {
        console.error(`❌ ID invalide dans orderedPress : ${_id}`, press);
        return res.status(400).json({ error: `ID invalide : ${_id}` });
      }

      // Validation de order
      if (!Number.isInteger(order)) {
        console.error(`❌ order invalide pour _id ${_id} : ${order}`, press);
        return res
          .status(400)
          .json({ error: `order invalide pour _id ${_id}` });
      }

      // Mise à jour uniquement du champ order
      const updatedPress = await Press.findByIdAndUpdate(
        _id,
        { order },
        { new: true } // Retourne le document mis à jour (optionnel)
      );

      if (!updatedPress) {
        console.error(`❌ Aucun article trouvé pour _id : ${_id}`);
        return res
          .status(404)
          .json({ error: `Aucun article trouvé pour _id : ${_id}` });
      }

      console.log(
        `Mise à jour réussie pour _id : ${_id}, nouvel order : ${order}`
      );
    }

    res.json({ message: "Ordre des articles mis à jour avec succès !" });
  } catch (error) {
    console.error("Erreur serveur dans updateOrder :", error);
    res.status(500).json({ error: error.message });
  }
};

// **Supprimer un article de presse**
exports.deletePress = async (req, res) => {
  try {
    console.log("Requête deletePress avec ID :", req.params.id);
    const deletedPress = await Press.findByIdAndDelete(req.params.id);
    if (!deletedPress)
      return res.status(404).json({ error: "Aucun article à supprimer" });
    res.json({ message: "Article supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
