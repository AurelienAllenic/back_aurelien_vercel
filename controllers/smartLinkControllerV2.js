const SmartLinkV2 = require("../models/SmartLinkV2");
const SmartLink = require("../models/smartLink");
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

  console.log("📥 Données reçues pour mise à jour :", updateData);

  try {
    if (!id) {
      return res.status(400).json({ message: "ID manquant dans la requête." });
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "Aucune donnée à mettre à jour." });
    }

    // ✅ Vérifie si le SmartLink est en V1
    const existingSmartLink = await SmartLink.findById(id);
    if (!existingSmartLink) {
      return res.status(404).json({ message: "SmartLink non trouvé." });
    }

    // ✅ Si un dossier est ajouté et que c'est un V1 -> supprimer et recréer en V2
    if (updateData.folder && !existingSmartLink.isV2) {
      console.log("🔄 Suppression du SmartLink V1 et création en V2...");

      // 1️⃣ Suppression du SmartLink V1
      await SmartLink.findByIdAndDelete(id);

      // 2️⃣ Création du nouveau SmartLink V2 avec **les nouvelles données de updateData**
      const newSmartLinkV2 = new SmartLinkV2({
        id: uuidv4(),
        title: updateData.title || existingSmartLink.title,
        linkType: updateData.linkType || existingSmartLink.linkType,
        titleType: updateData.titleType || existingSmartLink.titleType,
        modifiedTitle:
          updateData.modifiedTitle || existingSmartLink.modifiedTitle,
        link: updateData.link || existingSmartLink.link,
        folder: new mongoose.Types.ObjectId(updateData.folder), // Le nouveau dossier
      });

      await newSmartLinkV2.save();

      return res.status(201).json({
        message: "✅ SmartLink converti en V2 avec succès",
        data: newSmartLinkV2,
      });
    }

    // ✅ Si pas de conversion en V2, mise à jour classique
    if (updateData.folder) {
      updateData.folder = new mongoose.Types.ObjectId(updateData.folder);
    }

    const updatedSmartLink = await SmartLinkV2.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("folder");

    if (!updatedSmartLink) {
      return res.status(404).json({ message: "SmartLink non trouvé." });
    }

    // ✅ Met à jour le parentFolder si modifié
    if (updateData.parentFolder) {
      console.log(
        `🔄 Mise à jour du parentFolder du dossier ${updateData.folder}`
      );
      await Folder.findOneAndUpdate(
        { _id: updateData.folder },
        {
          $set: {
            parentFolder: new mongoose.Types.ObjectId(updateData.parentFolder),
          },
        },
        { new: true, runValidators: true }
      );
    }

    // ✅ Vérifie si le parentFolder est bien mis à jour
    const updatedFolder = await Folder.findById(updateData.folder).populate(
      "parentFolder"
    );

    console.log("✅ Dossier mis à jour avec parentFolder :", updatedFolder);

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
