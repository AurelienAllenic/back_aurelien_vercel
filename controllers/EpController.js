const Ep = require("../models/Ep");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

// Ajouter un EP
exports.addEp = async (req, res) => {
  const {
    index,
    title,
    author,
    compositor,
    alt,
    youtubeEmbed,
    social,
    classImg,
    description,
    link,
    ending,
    isActive,
  } = req.body;
  const file = req.file;

  // Retirer ending des champs obligatoires
  if (
    !index ||
    !title ||
    !author ||
    !compositor ||
    !alt ||
    !youtubeEmbed ||
    !description ||
    !link ||
    !file
  ) {
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
    const existingEp = await Ep.findOne({ index: newIndex });
    if (existingEp) {
      // Trouver le prochain index disponible
      const maxIndexEp = await Ep.findOne().sort({ index: -1 }).select("index");
      const nextIndex = maxIndexEp ? maxIndexEp.index + 1 : 1;

      // Mettre à jour l'EP existant avec le prochain index
      await Ep.updateOne(
        { _id: existingEp._id },
        { $set: { index: nextIndex } }
      );
    }

    // Upload de l'image à Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: "ep_covers",
      resource_type: "image",
    });

    const newEp = new Ep({
      index: newIndex,
      image: uploadResult.secure_url,
      classImg: classImg || "img-single",
      title,
      author,
      compositor,
      alt,
      youtubeEmbed,
      description,
      link,
      ending: ending || "", // Gérer ending comme optionnel, chaîne vide par défaut
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
      // social peut contenir : spotify, deezer, youtube, bandcamp, apple, amazon, tidal, itunes, soundCloud
      social: social ? JSON.parse(social) : {},
    });

    await newEp.save();

    res.status(201).json({ message: "✅ EP créé avec succès", data: newEp });
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'EP :", error);
    res.status(400).json({
      message: "Erreur lors de la création de l'EP",
      error: error.message,
    });
  }
};

// Récupérer tous les EPs
exports.findAllEps = async (req, res) => {
  try {
    const eps = await Ep.find().sort({ index: 1 });
    res.status(200).json({ message: "Liste des EPs", data: eps });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des EPs :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération des EPs",
      error: error.message,
    });
  }
};

// Récupérer un EP par ID
exports.findOneEp = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const ep = await Ep.findById(id);
    if (!ep) {
      return res.status(404).json({ message: "EP non trouvé." });
    }

    res.status(200).json({ message: "EP trouvé", data: ep });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l'EP :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération de l'EP",
      error: error.message,
    });
  }
};

// Mettre à jour un EP
exports.updateEp = async (req, res) => {
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
    description,
    link,
    ending,
    isActive,
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
    if (youtubeEmbed) updateData.youtubeEmbed = youtubeEmbed;
    // social peut contenir : spotify, deezer, youtube, bandcamp, apple, amazon, tidal, itunes, soundCloud
    if (social) updateData.social = JSON.parse(social);
    if (classImg) updateData.classImg = classImg;
    if (description) updateData.description = description;
    if (link) updateData.link = link;
    if (ending !== undefined) updateData.ending = ending || ""; // Gérer ending explicitement
    if (isActive !== undefined) {
      updateData.isActive = isActive === "true" || isActive === true;
    }

    // Gérer l'index si fourni
    if (index) {
      const newIndex = parseInt(index);
      if (isNaN(newIndex) || newIndex < 1) {
        return res
          .status(400)
          .json({ message: "L'index doit être un nombre positif." });
      }

      const existingEpWithIndex = await Ep.findOne({ index: newIndex });
      if (existingEpWithIndex && existingEpWithIndex._id.toString() !== id) {
        // Trouver le prochain index disponible
        const maxIndexEp = await Ep.findOne()
          .sort({ index: -1 })
          .select("index");
        const nextIndex = maxIndexEp ? maxIndexEp.index + 1 : 1;

        // Mettre à jour l'EP existant avec le prochain index
        await Ep.updateOne(
          { _id: existingEpWithIndex._id },
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

    const existingEp = await Ep.findById(id);
    if (!existingEp) {
      return res.status(404).json({ message: "EP non trouvé." });
    }

    if (file) {
      // Supprimer l'ancienne image de Cloudinary
      if (existingEp.image) {
        const oldPublicId = existingEp.image
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
        folder: "ep_covers",
        resource_type: "image",
      });
      updateData.image = uploadResult.secure_url;
    }

    const updatedEp = await Ep.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedEp) {
      return res.status(404).json({ message: "EP non trouvé." });
    }

    res.status(200).json({
      message: "EP mis à jour avec succès",
      data: updatedEp,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de l'EP :", error);
    res.status(400).json({
      message: "Erreur lors de la mise à jour de l'EP",
      error: error.message,
    });
  }
};

// Supprimer un EP
exports.deleteEp = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const ep = await Ep.findById(id);
    if (!ep) {
      return res.status(404).json({ message: "EP non trouvé." });
    }

    // Supprimer l'image de Cloudinary
    if (ep.image) {
      const publicId = ep.image.split("/").slice(-2).join("/").split(".")[0];
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      } catch (cloudinaryError) {
        console.warn(
          "⚠️ Erreur lors de la suppression de l'image Cloudinary :",
          cloudinaryError
        );
      }
    }

    // Supprimer l'EP de la base de données
    const result = await Ep.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "EP non trouvé." });
    }

    res.status(200).json({ message: "✅ EP supprimé avec succès." });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de l'EP :", error);
    res.status(400).json({
      message: "Erreur lors de la suppression de l'EP",
      error: error.message,
    });
  }
};
