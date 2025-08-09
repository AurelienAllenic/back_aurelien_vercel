const SmartLinkV2 = require("../models/SmartLinkV2");
const SmartLink = require("../models/SmartLink");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Folder = require("../models/Folder");
const Trash = require("../models/Trash");

// Ajouter un lien
exports.addSmartLink = async (req, res) => {
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

  try {
    if (!id) {
      return res.status(400).json({ message: "ID manquant dans la requête." });
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "Aucune donnée à mettre à jour." });
    }

    // ✅ Vérifier si l'ID appartient à un SmartLink V2 ou V1
    let existingSmartLink = await SmartLinkV2.findById(id);

    if (!existingSmartLink) {
      existingSmartLink = await SmartLink.findById(id);

      if (!existingSmartLink) {
        return res.status(404).json({ message: "SmartLink non trouvé." });
      }
    }

    // ✅ Si c'est un SmartLink V1 et un dossier est ajouté -> Supprimer et recréer en V2
    if (existingSmartLink instanceof SmartLink && updateData.folder) {
      // 1️⃣ Supprimer le SmartLink V1
      await SmartLink.findByIdAndDelete(id);

      // 2️⃣ Créer un SmartLink V2 avec les nouvelles données
      const newSmartLinkV2 = new SmartLinkV2({
        id: uuidv4(),
        title: updateData.title || existingSmartLink.title,
        linkType: updateData.linkType || existingSmartLink.linkType,
        titleType: updateData.titleType || existingSmartLink.titleType,
        modifiedTitle:
          updateData.modifiedTitle || existingSmartLink.modifiedTitle,
        link: updateData.link || existingSmartLink.link,
        folder: new mongoose.Types.ObjectId(updateData.folder), // Associer au nouveau dossier
      });

      await newSmartLinkV2.save();

      return res.status(201).json({
        message: "✅ SmartLink converti en V2 avec succès",
        data: newSmartLinkV2,
      });
    }

    // ✅ Si c'est déjà un SmartLink V2, mise à jour classique
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

    // ✅ Si un parentFolder est modifié, mise à jour du dossier
    if (updateData.parentFolder) {
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

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    // ✅ Chercher d'abord dans SmartLinkV2, puis dans SmartLink V1
    let smartLink = await SmartLinkV2.findById(id);
    let entityType = "SmartLinkV2";

    if (!smartLink) {
      smartLink = await SmartLink.findById(id);
      entityType = "SmartLink";
    }

    if (!smartLink) {
      return res.status(404).json({ message: "SmartLink non trouvé." });
    }

    // ✅ Retirer du dossier si applicable (seulement pour V2)
    if (entityType === "SmartLinkV2" && smartLink.folder) {
      await Folder.findByIdAndUpdate(smartLink.folder, {
        $pull: { smartLinks: id },
      });
    }

    // ✅ Sauvegarder dans la corbeille
    await Trash.create({
      entityType,
      originalId: smartLink._id,
      data: smartLink.toObject(),
    });

    // ✅ Supprimer l'entrée d’origine
    if (entityType === "SmartLinkV2") {
      await SmartLinkV2.deleteOne({ _id: id });
    } else {
      await SmartLink.deleteOne({ _id: id });
    }

    res
      .status(200)
      .json({ message: `✅ ${entityType} mis à la corbeille avec succès.` });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du SmartLink :", error);
    res.status(400).json({
      message: "Erreur lors de la suppression du SmartLink",
      error: error.message,
    });
  }
};
