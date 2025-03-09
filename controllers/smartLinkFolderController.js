const Folder = require("../models/Folder");
const mongoose = require("mongoose");

// ✅ Ajouter un dossier
exports.addFolder = async (req, res) => {
  console.log("📥 Données reçues :", req.body);

  const { title, parentFolder } = req.body;

  if (!title) {
    console.log("❌ Titre du dossier manquant");
    return res.status(400).json({ message: "Le titre du dossier est requis." });
  }

  try {
    const newFolder = new Folder({
      title,
      parentFolder: parentFolder
        ? new mongoose.Types.ObjectId(parentFolder)
        : null,
    });

    await newFolder.save();
    res
      .status(201)
      .json({ message: "✅ Dossier créé avec succès", data: newFolder });
  } catch (error) {
    console.error("❌ Erreur backend :", error);
    res.status(400).json({
      message: "Erreur lors de la création du dossier",
      error: error.message,
    });
  }
};

// ✅ Récupérer tous les dossiers
exports.findAllFolders = async (req, res) => {
  try {
    const folders = await Folder.find().populate("smartLinks");

    res.status(200).json({ message: "Liste des dossiers", data: folders });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des dossiers :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération des dossiers",
      error: error.message,
    });
  }
};

// ✅ Récupérer un dossier par ID
exports.findOneFolder = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const folder = await Folder.findById(id).populate("parentFolder");
    if (!folder) {
      return res.status(404).json({ message: "Dossier non trouvé." });
    }

    res.status(200).json({ message: "Dossier trouvé", data: folder });
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la récupération du dossier",
      error: error.message,
    });
  }
};

// ✅ Mettre à jour un dossier
exports.updateFolder = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  console.log("Données reçues pour la mise à jour:", updateData);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: "Aucune donnée à mettre à jour." });
  }

  try {
    // Si un parentFolder est fourni, s'assurer qu'il est bien sous forme d'ObjectId
    if (updateData.parentFolder) {
      updateData.parentFolder = new mongoose.Types.ObjectId(
        updateData.parentFolder
      );
    }

    const updatedFolder = await Folder.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("parentFolder");

    if (!updatedFolder) {
      return res.status(404).json({ message: "Dossier non trouvé." });
    }

    res
      .status(200)
      .json({ message: "Dossier mis à jour avec succès", data: updatedFolder });
  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error);
    res.status(400).json({
      message: "Erreur lors de la mise à jour du dossier",
      error: error.message,
    });
  }
};

// ✅ Supprimer un dossier
exports.deleteFolder = async (req, res) => {
  const { id } = req.params;
  const { deleteSmartLinks } = req.body;

  console.log("ID reçu pour suppression : ", id);
  console.log("Supprimer les SmartLinks associés ? ", deleteSmartLinks);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const subfolders = await Folder.find({ parentFolder: id });
    if (subfolders.length > 0) {
      return res.status(400).json({
        message:
          "Impossible de supprimer ce dossier car il contient des sous-dossiers.",
      });
    }

    if (!deleteSmartLinks) {
      await SmartLink.updateMany({ folder: id }, { $unset: { folder: 1 } });
    } else {
      await SmartLink.deleteMany({ folder: id });
    }

    const result = await Folder.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Dossier non trouvé." });
    }

    res.status(200).json({ message: "Dossier supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression du dossier : ", error);
    res.status(400).json({
      message: "Erreur lors de la suppression du dossier",
      error: error.message,
    });
  }
};
