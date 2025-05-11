const Single = require("../models/Single");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

// Ajouter un single
exports.addSingle = async (req, res) => {
  const {
    index,
    title,
    author,
    compositor,
    alt,
    youtubeEmbed,
    social,
    classImg,
  } = req.body;
  const file = req.file;

  // Vérifier les champs obligatoires
  if (!index || !title || !author || !compositor || !alt || !file) {
    return res
      .status(400)
      .json({ message: "Tous les champs obligatoires doivent être remplis." });
  }

  try {
    // Convertir index en nombre
    const newIndex = parseInt(index);
    if (isNaN(newIndex) || newIndex < 1) {
      return res
        .status(400)
        .json({ message: "L'index doit être un nombre positif." });
    }

    // Vérifier si l'index existe déjà
    const existingSingle = await Single.findOne({ index: newIndex });
    if (existingSingle) {
      // Trouver le prochain index disponible
      const maxIndexSingle = await Single.findOne()
        .sort({ index: -1 })
        .select("index");
      const nextIndex = maxIndexSingle ? maxIndexSingle.index + 1 : 1;

      // Mettre à jour le single existant avec le prochain index
      await Single.updateOne(
        { _id: existingSingle._id },
        { $set: { index: nextIndex } }
      );
    }

    // Upload de l'image à Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: "single_covers",
      resource_type: "image",
    });

    const newSingle = new Single({
      index: newIndex,
      image: uploadResult.secure_url,
      classImg: classImg || "img-single",
      title,
      author,
      compositor,
      alt,
      youtubeEmbed: youtubeEmbed || "",
      social: social ? JSON.parse(social) : {},
    });

    await newSingle.save();

    res
      .status(201)
      .json({ message: "✅ Single créé avec succès", data: newSingle });
  } catch (error) {
    console.error("❌ Erreur lors de la création du single :", error);
    res.status(400).json({
      message: "Erreur lors de la création du single",
      error: error.message,
    });
  }
};

// Récupérer tous les singles
exports.findAllSingles = async (req, res) => {
  try {
    const singles = await Single.find().sort({ index: 1 });
    res.status(200).json({ message: "Liste des singles", data: singles });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des singles :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération des singles",
      error: error.message,
    });
  }
};

// Récupérer un single par ID
exports.findOneSingle = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const single = await Single.findById(id);
    if (!single) {
      return res.status(404).json({ message: "Single non trouvé." });
    }

    res.status(200).json({ message: "Single trouvé", data: single });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du single :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération du single",
      error: error.message,
    });
  }
};

exports.updateSingle = async (req, res) => {
  const { id } = req.params;
  const {
    index,
    title,
    author,
    compositor,
    alt,
    youtubeEmbed,
    social,
    classImg,
  } = req.body;
  const file = req.file;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID invalide." });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (author) updateData.author = author;
    if (compositor) updateData.compositor = compositor;
    if (alt) updateData.alt = alt;
    if (youtubeEmbed !== undefined)
      updateData.youtubeEmbed = youtubeEmbed || "";
    if (social) updateData.social = JSON.parse(social);
    if (classImg) updateData.classImg = classImg;

    // Gérer l'index si fourni
    if (index) {
      const newIndex = parseInt(index);
      if (isNaN(newIndex) || newIndex < 1) {
        return res
          .status(400)
          .json({ message: "L'index doit être un nombre positif." });
      }

      const existingSingleWithIndex = await Single.findOne({ index: newIndex });
      if (
        existingSingleWithIndex &&
        existingSingleWithIndex._id.toString() !== id
      ) {
        // Trouver le prochain index disponible
        const maxIndexSingle = await Single.findOne()
          .sort({ index: -1 })
          .select("index");
        const nextIndex = maxIndexSingle ? maxIndexSingle.index + 1 : 1;

        // Mettre à jour le single existant avec le prochain index
        await Single.updateOne(
          { _id: existingSingleWithIndex._id },
          { $set: { index: nextIndex } }
        );
      }
      updateData.index = newIndex;
    }

    if (Object.keys(updateData).length === 0 && !file) {
      return res
        .status(400)
        .json({ message: "Aucune donnée à mettre à jour." });
    }

    const existingSingle = await Single.findById(id);
    if (!existingSingle) {
      return res.status(404).json({ message: "Single non trouvé." });
    }

    if (file) {
      // Supprimer l'ancienne image de Cloudinary
      if (existingSingle.image) {
        const oldPublicId = existingSingle.image
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

      // Upload de la nouvelle image à Cloudinary
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: "single_covers",
        resource_type: "image",
      });
      updateData.image = uploadResult.secure_url;
    }

    const updatedSingle = await Single.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedSingle) {
      return res.status(404).json({ message: "Single non trouvé." });
    }

    res.status(200).json({
      message: "Single mis à jour avec succès",
      data: updatedSingle,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du single :", error);
    res.status(400).json({
      message: "Erreur lors de la mise à jour du single",
      error: error.message,
    });
  }
};

// Supprimer un single
exports.deleteSingle = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const single = await Single.findById(id);
    if (!single) {
      return res.status(404).json({ message: "Single non trouvé." });
    }

    // Supprimer l'image de Cloudinary
    if (single.image) {
      const publicId = single.image
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

    // Supprimer le single de la base de données
    const result = await Single.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Single non trouvé." });
    }

    res.status(200).json({ message: "✅ Single supprimé avec succès." });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du single :", error);
    res.status(400).json({
      message: "Erreur lors de la suppression du single",
      error: error.message,
    });
  }
};
