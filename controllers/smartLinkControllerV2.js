const SmartLinkV2 = require("../models/SmartLinkV2");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Folder = require("../models/Folder");

// Ajouter un lien
exports.addSmartLink = async (req, res) => {
  console.log("📥 Données reçues :", req.body);
  const { title, linkType, titleType, modifiedTitle, link, folder } = req.body;

  if (!title || !linkType || !titleType || !modifiedTitle || !link) {
    return res
      .status(400)
      .json({ message: "Tous les champs sont requis, sauf le dossier." });
  }

  try {
    const newSmartLink = new SmartLinkV2({
      id: uuidv4(),
      title,
      linkType,
      titleType,
      modifiedTitle,
      link,
      folder: folder && mongoose.Types.ObjectId.isValid(folder) ? folder : null,
    });

    await newSmartLink.save();

    // ✅ Ajout du SmartLink au dossier s'il existe
    if (folder) {
      await Folder.findByIdAndUpdate(folder, {
        $push: { smartLinks: newSmartLink._id },
      });
    }

    res
      .status(201)
      .json({ message: "✅ SmartLink créé avec succès", data: newSmartLink });
  } catch (error) {
    console.error("❌ Erreur backend :", error);
    res.status(400).json({
      message: "Erreur lors de la création du SmartLink",
      error: error.message,
    });
  }
};

exports.findAllSmartLinks = async (req, res) => {
  try {
    const smartLinks = await SmartLinkV2.find();
    res.status(200).json({ message: "Liste des smartLinks", data: smartLinks });
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la récupération des smartLinks",
      error: error.message,
    });
  }
};

exports.findOneSmartLink = async (req, res) => {
  const { id } = req.params;

  try {
    const smartLink = await SmartLinkV2.findById(id);
    if (!smartLink) {
      return res.status(404).json({ message: "SmartLink non trouvé." });
    }

    res.status(200).json({ message: "smartLink trouvé", data: smartLink });
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la récupération du smartLink",
      error: error.message,
    });
  }
};

exports.updateSmartLink = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  console.log("📥 Données reçues pour mise à jour :", updateData); // ⬅️ LOG AVANT MISE À JOUR

  try {
    if (!id) {
      return res.status(400).json({ message: "ID manquant dans la requête." });
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "Aucune donnée à mettre à jour." });
    }

    // ✅ Convertir parentFolder en ObjectId s'il existe
    if (updateData.parentFolder) {
      updateData.parentFolder = new mongoose.Types.ObjectId(
        updateData.parentFolder
      );
    }

    const updatedSmartLink = await SmartLinkV2.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("folder")
      .populate("folder.parentFolder"); // ✅ Vérifie que le parentFolder est bien récupéré

    if (!updatedSmartLink) {
      return res.status(404).json({ message: "SmartLink non trouvé." });
    }

    console.log("✅ SmartLink mis à jour :", updatedSmartLink); // ⬅️ LOG APRÈS MISE À JOUR

    res.status(200).json({
      message: "SmartLink mis à jour avec succès",
      data: updatedSmartLink,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour :", error);
    res.status(400).json({
      message: "Erreur lors de la mise à jour du SmartLink",
      error: error.message,
    });
  }
};

exports.deleteSmartLink = async (req, res) => {
  const { id } = req.params;
  console.log("📤 Suppression du SmartLink :", id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    // ✅ Récupérer le SmartLink pour voir s'il est dans un dossier
    const smartLink = await SmartLinkV2.findById(id);
    if (!smartLink) {
      return res.status(404).json({ message: "SmartLink non trouvé." });
    }

    // ✅ Si le SmartLink est dans un dossier, le retirer du champ `smartLinks`
    if (smartLink.folder) {
      await Folder.findByIdAndUpdate(smartLink.folder, {
        $pull: { smartLinks: id }, // Retire l'ID du SmartLink de la liste des SmartLinks du dossier
      });
      console.log(`✅ SmartLink ${id} supprimé du dossier ${smartLink.folder}`);
    }

    // ✅ Supprimer le SmartLink de la base de données
    const result = await SmartLinkV2.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "SmartLink non trouvé." });
    }

    res.status(200).json({ message: "✅ SmartLink supprimé avec succès." });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du SmartLink :", error);
    res.status(400).json({
      message: "Erreur lors de la suppression du SmartLink",
      error: error.message,
    });
  }
};
