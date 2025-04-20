const Video = require("../models/Videos");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const fs = require("fs").promises;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Ajouter une vidéo
exports.addVideo = async (req, res) => {
  const { index, link, classVid, alt, title, modifiedTitle } = req.body;
  const file = req.file;

  if (!link || !classVid || !alt || !file || !title || !modifiedTitle) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    // Upload image à Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: "captures_3d",
      resource_type: "image",
    });

    // Supprimer le fichier temporaire
    try {
      await fs.unlink(file.path);
    } catch (cleanupError) {
      console.warn(
        "⚠️ Erreur lors du nettoyage du fichier temporaire :",
        cleanupError
      );
    }

    const newVideo = new Video({
      link,
      classVid,
      alt,
      image: uploadResult.secure_url,
      title,
      modifiedTitle,
    });

    await newVideo.save();

    res
      .status(201)
      .json({ message: "✅ Vidéo créée avec succès", data: newVideo });
  } catch (error) {
    console.error("❌ Erreur backend :", error);
    if (file && file.path) {
      try {
        await fs.unlink(file.path);
      } catch (cleanupError) {
        console.warn(
          "⚠️ Erreur lors du nettoyage du fichier temporaire :",
          cleanupError
        );
      }
    }
    res.status(400).json({
      message: "Erreur lors de la création de la vidéo",
      error: error.message,
    });
  }
};

// Récupérer toutes les vidéos
exports.findAllVideos = async (req, res) => {
  try {
    const videos = await Video.find();
    res.status(200).json({ message: "Liste des vidéos", data: videos });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des vidéos :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération des vidéos",
      error: error.message,
    });
  }
};

// Récupérer une vidéo par ID
exports.findOneVideo = async (req, res) => {
  const { id } = req.params;

  try {
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ message: "Vidéo non trouvée." });
    }

    res.status(200).json({ message: "Vidéo trouvée", data: video });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la vidéo :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération de la vidéo",
      error: error.message,
    });
  }
};

// Mettre à jour une vidéo
exports.updateVideo = async (req, res) => {
  const { id } = req.params;
  const { link, classVid, alt, title, modifiedTitle } = req.body;
  const file = req.file;

  try {
    if (!id) {
      return res.status(400).json({ message: "ID manquant dans la requête." });
    }

    const updateData = {};
    if (link) updateData.link = link;
    if (classVid) updateData.classVid = classVid;
    if (alt) updateData.alt = alt;
    if (title) updateData.title = title;
    if (modifiedTitle) updateData.modifiedTitle = modifiedTitle;

    if (Object.keys(updateData).length === 0 && !file) {
      return res
        .status(400)
        .json({ message: "Aucune donnée à mettre à jour." });
    }

    const existingVideo = await Video.findById(id);
    if (!existingVideo) {
      return res.status(404).json({ message: "Vidéo non trouvée." });
    }

    if (file) {
      // Supprimer l'ancienne image de Cloudinary
      if (existingVideo.image) {
        const oldPublicId = existingVideo.image
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

      // Upload nouvelle image à Cloudinary
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: "captures_3d",
        resource_type: "image",
      });
      updateData.image = uploadResult.secure_url;

      // Supprimer le fichier temporaire
      try {
        await fs.unlink(file.path);
      } catch (cleanupError) {
        console.warn(
          "⚠️ Erreur lors du nettoyage du fichier temporaire :",
          cleanupError
        );
      }
    }

    const updatedVideo = await Video.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedVideo) {
      return res.status(404).json({ message: "Vidéo non trouvée." });
    }

    res.status(200).json({
      message: "Vidéo mise à jour avec succès",
      data: updatedVideo,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour :", error);
    if (file && file.path) {
      try {
        await fs.unlink(file.path);
      } catch (cleanupError) {
        console.warn(
          "⚠️ Erreur lors du nettoyage du fichier temporaire :",
          cleanupError
        );
      }
    }
    res.status(400).json({
      message: "Erreur lors de la mise à jour de la vidéo",
      error: error.message,
    });
  }
};

// Supprimer une vidéo
exports.deleteVideo = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ message: "Vidéo non trouvée." });
    }
    /*
    // Supprimer l'image de Cloudinary
    if (video.image) {
      const publicId = video.image.split("/").slice(-2).join("/").split(".")[0];
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      } catch (cloudinaryError) {
        console.warn(
          "⚠️ Erreur lors de la suppression de l'image Cloudinary :",
          cloudinaryError
        );
      }
    }
*/
    // Supprimer la vidéo de la base de données
    const result = await Video.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Vidéo non trouvée." });
    }

    res.status(200).json({ message: "✅ Vidéo supprimée avec succès." });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la vidéo :", error);
    res.status(400).json({
      message: "Erreur lors de la suppression de la vidéo",
      error: error.message,
    });
  }
};
