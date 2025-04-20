const Video = require("../models/Video");
const mongoose = require("mongoose");

// Ajouter une vidéo
exports.addVideo = async (req, res) => {
  const { index, link, classVid, alt, image, title, modifiedTitle } = req.body;

  if (
    !index ||
    !link ||
    !classVid ||
    !alt ||
    !image ||
    !title ||
    !modifiedTitle
  ) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    const newVideo = new Video({
      index,
      link,
      classVid,
      alt,
      image,
      title,
      modifiedTitle,
    });

    await newVideo.save();

    res
      .status(201)
      .json({ message: "✅ Vidéo créée avec succès", data: newVideo });
  } catch (error) {
    console.error("❌ Erreur backend :", error);
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
    res.status(400).json({
      message: "Erreur lors de la récupération de la vidéo",
      error: error.message,
    });
  }
};

// Mettre à jour une vidéo
exports.updateVideo = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    if (!id) {
      return res.status(400).json({ message: "ID manquant dans la requête." });
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "Aucune donnée à mettre à jour." });
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
