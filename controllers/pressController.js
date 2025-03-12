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

    // Upload de l'image sur Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "press",
    });

    // Trouver le plus grand ordre actuel et ajouter +1 pour le nouveau
    const lastPress = await Press.findOne().sort({ order: -1 });
    const newOrder = lastPress ? lastPress.order + 1 : 0;

    // Création de l'article de presse avec le champ `order`
    const press = new Press({
      image: result.secure_url,
      link: link && link.trim() !== "" ? link : null,
      alt,
      order: newOrder, // Assignation du nouvel ordre
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
    const press = await Press.find().sort({ order: 1 }); // Trie par ordre croissant
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

// **Mettre à jour l'ordre des articles**
exports.updateOrder = async (req, res) => {
  try {
    const { orderedPress } = req.body;
    console.log("Données reçues par le serveur :", orderedPress); // Ajoute ceci
    const bulkOps = orderedPress.map((press) => ({
      updateOne: {
        filter: { _id: press._id },
        update: { order: press.order },
      },
    }));
    await Press.bulkWrite(bulkOps);
    res.json({ message: "Ordre des articles mis à jour avec succès !" });
  } catch (error) {
    console.error("Erreur serveur :", error); // Log plus détaillé
    res.status(500).json({ error: error.message });
  }
};

// **Supprimer un article de presse**
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
