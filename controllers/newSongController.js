const NewSong = require("../models/NewSong");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

// Ajouter une nouvelle chanson
exports.addNewSong = async (req, res) => {
  // Debug: afficher ce qui est reçu
  console.log("📥 req.body:", req.body);
  console.log("📥 req.file:", req.file);
  
  const { title, date, isActive } = req.body;

  // Le fichier uploadé via CloudinaryStorage (upload.single("image") met le fichier dans req.file)
  const imageFile = req.file;

  if (!title || !date || !imageFile) {
    return res.status(400).json({
      message:
        "Tous les champs obligatoires doivent être remplis (title, date, image).",
    });
  }

  try {
    // Validation de la date
    const songDate = new Date(date);
    if (isNaN(songDate.getTime())) {
      return res.status(400).json({
        message: "Format de date invalide. Utilisez le format ISO (ex: 2026-01-23T00:00:00).",
      });
    }

    // ✅ Avec CloudinaryStorage, le fichier est déjà uploadé
    // L'URL Cloudinary est dans file.path (ou file.secure_url selon la config)
    const imageUrl = imageFile.path || imageFile.secure_url;

    const newSong = new NewSong({
      title,
      date: songDate,
      image: imageUrl,
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
    });

    await newSong.save();

    res
      .status(201)
      .json({ message: "✅ Nouvelle chanson créée avec succès", data: newSong });
  } catch (error) {
    console.error("❌ Erreur lors de la création de la nouvelle chanson :", error);
    res.status(400).json({
      message: "Erreur lors de la création de la nouvelle chanson",
      error: error.message,
    });
  }
};

// Récupérer toutes les nouvelles chansons (pour le frontend public - uniquement actives)
exports.findAllNewSongs = async (req, res) => {
  try {
    const newSongs = await NewSong.find({ isActive: true }).sort({ date: -1 });
    res.status(200).json({ message: "Liste des nouvelles chansons", data: newSongs });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des nouvelles chansons :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération des nouvelles chansons",
      error: error.message,
    });
  }
};

// Récupérer toutes les nouvelles chansons (pour le backoffice - actives et inactives)
exports.findAllNewSongsAdmin = async (req, res) => {
  try {
    const newSongs = await NewSong.find().sort({ date: -1 });
    res.status(200).json({ message: "Liste des nouvelles chansons", data: newSongs });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des nouvelles chansons :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération des nouvelles chansons",
      error: error.message,
    });
  }
};

// Récupérer une nouvelle chanson par ID
exports.findOneNewSong = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const newSong = await NewSong.findById(id);
    if (!newSong) {
      return res.status(404).json({ message: "Nouvelle chanson non trouvée." });
    }

    res.status(200).json({ message: "Nouvelle chanson trouvée", data: newSong });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la nouvelle chanson :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération de la nouvelle chanson",
      error: error.message,
    });
  }
};

// Mettre à jour une nouvelle chanson
exports.updateNewSong = async (req, res) => {
  const { id } = req.params;
  const { title, date, isActive } = req.body;

  // Le fichier uploadé via CloudinaryStorage (upload.single("image") met le fichier dans req.file)
  const imageFile = req.file;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID invalide." });
    }

    const existingNewSong = await NewSong.findById(id);
    if (!existingNewSong) {
      return res.status(404).json({ message: "Nouvelle chanson non trouvée." });
    }

    const updateData = {};

    // Mise à jour des champs texte
    if (title !== undefined) updateData.title = title;
    if (date !== undefined) {
      const songDate = new Date(date);
      if (isNaN(songDate.getTime())) {
        return res.status(400).json({
          message: "Format de date invalide. Utilisez le format ISO (ex: 2026-01-23T00:00:00).",
        });
      }
      updateData.date = songDate;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive === "true" || isActive === true;
    }

    // Upload nouvelle image
    if (imageFile) {
      // Supprimer l'ancienne image de Cloudinary
      if (existingNewSong.image) {
        const oldPublicId = existingNewSong.image
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];
        try {
          await cloudinary.uploader.destroy(oldPublicId, {
            resource_type: "image",
          });
        } catch (cloudinaryError) {
          console.warn(
            "⚠️ Erreur lors de la suppression de l'ancienne image :",
            cloudinaryError
          );
        }
      }
      // ✅ Avec CloudinaryStorage, le fichier est déjà uploadé
      updateData.image = imageFile.path || imageFile.secure_url;
    }

    // Vérifier qu'il y a des données à mettre à jour
    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "Aucune donnée à mettre à jour." });
    }

    const updatedNewSong = await NewSong.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "✅ Nouvelle chanson mise à jour avec succès",
      data: updatedNewSong,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la nouvelle chanson :", error);
    res.status(400).json({
      message: "Erreur lors de la mise à jour de la nouvelle chanson",
      error: error.message,
    });
  }
};

// Supprimer une nouvelle chanson
exports.deleteNewSong = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const newSong = await NewSong.findById(id);
    if (!newSong) {
      return res.status(404).json({ message: "Nouvelle chanson non trouvée." });
    }

    // Supprimer l'image de Cloudinary
    if (newSong.image) {
      const publicId = newSong.image
        .split("/")
        .slice(-2)
        .join("/")
        .split(".")[0];
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      } catch (cloudinaryError) {
        console.warn(
          "⚠️ Erreur lors de la suppression de l'image Cloudinary :",
          cloudinaryError
        );
      }
    }

    const result = await NewSong.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Nouvelle chanson non trouvée." });
    }

    res.status(200).json({ message: "✅ Nouvelle chanson supprimée avec succès." });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la nouvelle chanson :", error);
    res.status(400).json({
      message: "Erreur lors de la suppression de la nouvelle chanson",
      error: error.message,
    });
  }
};
