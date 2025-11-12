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
  const files = req.files;
  const imageFile = files?.image?.[0];
  const streamFile = files?.imageStreamPage?.[0];

  if (!index || !title || !author || !compositor || !alt || !imageFile) {
    return res.status(400).json({
      message:
        "Tous les champs obligatoires doivent être remplis (index, title, author, compositor, alt, image).",
    });
  }

  try {
    const newIndex = parseInt(index);
    if (isNaN(newIndex) || newIndex < 1) {
      return res
        .status(400)
        .json({ message: "L'index doit être un nombre positif." });
    }

    // Gestion du conflit d'index
    const existingSingle = await Single.findOne({ index: newIndex });
    if (existingSingle) {
      const maxIndexSingle = await Single.findOne()
        .sort({ index: -1 })
        .select("index");
      const nextIndex = maxIndexSingle ? maxIndexSingle.index + 1 : 1;
      await Single.updateOne(
        { _id: existingSingle._id },
        { $set: { index: nextIndex } }
      );
    }

    // Upload de l'image principale
    const uploadResult = await cloudinary.uploader.upload(imageFile.path, {
      folder: "single_covers",
      resource_type: "image",
    });

    // Upload de l'image stream (optionnelle)
    let streamUrl = null;
    if (streamFile) {
      const streamUploadResult = await cloudinary.uploader.upload(
        streamFile.path,
        {
          folder: "stream_pages",
          resource_type: "image",
        }
      );
      streamUrl = streamUploadResult.secure_url;
    }

    const newSingle = new Single({
      index: newIndex,
      image: uploadResult.secure_url,
      classImg: classImg || "img-single",
      imageStreamPage: streamUrl,
      title,
      author,
      compositor,
      alt,
      youtubeEmbed: youtubeEmbed || undefined,
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
  const files = req.files;
  const imageFile = files?.image?.[0];
  const streamFile = files?.imageStreamPage?.[0];

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID invalide." });
    }

    const existingSingle = await Single.findById(id);
    if (!existingSingle) {
      return res.status(404).json({ message: "Single non trouvé." });
    }

    const updateData = {};

    // Mise à jour des champs texte
    if (title !== undefined) updateData.title = title;
    if (author !== undefined) updateData.author = author;
    if (compositor !== undefined) updateData.compositor = compositor;
    if (alt !== undefined) updateData.alt = alt;
    if (youtubeEmbed !== undefined)
      updateData.youtubeEmbed = youtubeEmbed || undefined;
    if (social !== undefined) updateData.social = JSON.parse(social);
    if (classImg !== undefined) updateData.classImg = classImg;

    // Gestion de l'index
    if (index !== undefined) {
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
        const maxIndexSingle = await Single.findOne()
          .sort({ index: -1 })
          .select("index");
        const nextIndex = maxIndexSingle ? maxIndexSingle.index + 1 : 1;
        await Single.updateOne(
          { _id: existingSingleWithIndex._id },
          { $set: { index: nextIndex } }
        );
      }
      updateData.index = newIndex;
    }

    // Upload nouvelle image principale
    if (imageFile) {
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

      const uploadResult = await cloudinary.uploader.upload(imageFile.path, {
        folder: "single_covers",
        resource_type: "image",
      });
      updateData.image = uploadResult.secure_url;
    }

    // Upload nouvelle image stream
    if (streamFile) {
      if (existingSingle.imageStreamPage) {
        const oldStreamPublicId = existingSingle.imageStreamPage
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];
        try {
          await cloudinary.uploader.destroy(oldStreamPublicId, {
            resource_type: "image",
          });
        } catch (cloudinaryError) {
          console.warn(
            "⚠️ Erreur lors de la suppression de l'ancienne image stream :",
            cloudinaryError
          );
        }
      }

      const streamUploadResult = await cloudinary.uploader.upload(
        streamFile.path,
        {
          folder: "stream_pages",
          resource_type: "image",
        }
      );
      updateData.imageStreamPage = streamUploadResult.secure_url;
    }

    // Vérifier qu'il y a des données à mettre à jour
    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "Aucune donnée à mettre à jour." });
    }

    const updatedSingle = await Single.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "✅ Single mis à jour avec succès",
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
