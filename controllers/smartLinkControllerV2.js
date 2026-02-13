const SmartLinkV2 = require("../models/SmartLinkV2");
const SmartLink = require("../models/SmartLink");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Folder = require("../models/Folder");
const Trash = require("../models/Trash");

// ✅ Ajouter un lien avec ordre automatique
exports.addSmartLink = async (req, res) => {
  const { title, linkType, linkTypePrefix, titleType, modifiedTitle, link, folder } = req.body;

  if (!title || !linkType || !titleType || !modifiedTitle || !link) {
    return res
      .status(400)
      .json({ message: "Tous les champs sont requis, sauf le dossier et le préfixe." });
  }

  try {
    // Déterminer l'ordre automatiquement
    const lastSmartLink = await SmartLinkV2.findOne(
      folder && mongoose.Types.ObjectId.isValid(folder) 
        ? { folder } 
        : { folder: null }
    ).sort({ order: -1 });
    const newOrder = lastSmartLink ? lastSmartLink.order + 1 : 0;

    const newSmartLink = new SmartLinkV2({
      id: uuidv4(),
      title,
      linkType,
      linkTypePrefix: linkTypePrefix || "", // ✅ Ajout du préfixe (optionnel)
      titleType,
      modifiedTitle,
      link,
      folder: folder && mongoose.Types.ObjectId.isValid(folder) ? folder : null,
      order: newOrder,
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

// ✅ Récupérer tous les SmartLinks triés par ordre
exports.findAllSmartLinks = async (req, res) => {
  try {
    const smartLinks = await SmartLinkV2.find().sort({ order: 1 });
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
      // Déterminer l'ordre pour le nouveau dossier
      const lastSmartLink = await SmartLinkV2.findOne({
        folder: new mongoose.Types.ObjectId(updateData.folder),
      }).sort({ order: -1 });
      const newOrder = lastSmartLink ? lastSmartLink.order + 1 : 0;

      // 1️⃣ Supprimer le SmartLink V1
      await SmartLink.findByIdAndDelete(id);

      // 2️⃣ Créer un SmartLink V2 avec les nouvelles données
      const newSmartLinkV2 = new SmartLinkV2({
        id: uuidv4(),
        title: updateData.title || existingSmartLink.title,
        linkType: updateData.linkType || existingSmartLink.linkType,
        linkTypePrefix: updateData.linkTypePrefix || "", // ✅ Ajout du préfixe
        titleType: updateData.titleType || existingSmartLink.titleType,
        modifiedTitle:
          updateData.modifiedTitle || existingSmartLink.modifiedTitle,
        link: updateData.link || existingSmartLink.link,
        folder: new mongoose.Types.ObjectId(updateData.folder),
        order: newOrder,
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

// ✅ **Mettre à jour l'ordre des SmartLinks**
exports.updateOrder = async (req, res) => {
  try {
    const { orderedSmartLinks } = req.body;
    if (!Array.isArray(orderedSmartLinks)) {
      console.error("❌ ERREUR: orderedSmartLinks doit être un tableau !");
      return res
        .status(400)
        .json({ error: "orderedSmartLinks doit être un tableau" });
    }

    const currentOrders = {};
    const smartLinkDocs = await SmartLinkV2.find();

    smartLinkDocs.forEach((doc) => {
      currentOrders[doc._id.toString()] = doc.order;
    });

    for (const smartLink of orderedSmartLinks) {
      const { _id, order: newOrder } = smartLink;

      if (!mongoose.Types.ObjectId.isValid(_id)) {
        console.error(`❌ ID invalide : ${_id}`);
        return res.status(400).json({ error: `ID invalide : ${_id}` });
      }

      const oldOrder = currentOrders[_id];

      if (oldOrder !== newOrder) {
        const swappedSmartLink = await SmartLinkV2.findOne({ order: newOrder });

        if (swappedSmartLink) {
          await SmartLinkV2.updateOne(
            { _id: swappedSmartLink._id },
            { $set: { order: oldOrder } }
          );
        }

        await SmartLinkV2.updateOne(
          { _id: new mongoose.Types.ObjectId(_id) },
          { $set: { order: newOrder } }
        );
      }
    }

    res.json({ message: "Ordre mis à jour avec succès !" });
  } catch (error) {
    console.error("❌ Erreur serveur dans updateOrder :", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Déplacer un SmartLink vers un autre dossier
exports.moveSmartLink = async (req, res) => {
  const { smartLinkId, newFolderId } = req.body;

  console.log("📥 Déplacement du SmartLink :", smartLinkId, "vers", newFolderId);

  if (!mongoose.Types.ObjectId.isValid(smartLinkId)) {
    return res.status(400).json({ message: "ID du SmartLink invalide." });
  }

  if (newFolderId && newFolderId !== "no-folder" && !mongoose.Types.ObjectId.isValid(newFolderId)) {
    return res.status(400).json({ message: "ID du dossier invalide." });
  }

  try {
    const smartLink = await SmartLinkV2.findById(smartLinkId);
    if (!smartLink) {
      return res.status(404).json({ message: "SmartLink non trouvé." });
    }

    const oldFolderId = smartLink.folder;

    // Retirer du dossier précédent
    if (oldFolderId) {
      await Folder.findByIdAndUpdate(oldFolderId, {
        $pull: { smartLinks: smartLinkId },
      });
    }

    // Ajouter au nouveau dossier
    const finalFolderId = newFolderId === "no-folder" ? null : newFolderId;
    if (finalFolderId) {
      await Folder.findByIdAndUpdate(finalFolderId, {
        $push: { smartLinks: smartLinkId },
      });
    }

    // Déterminer le nouvel ordre
    const lastSmartLink = await SmartLinkV2.findOne(
      finalFolderId ? { folder: finalFolderId } : { folder: null }
    ).sort({ order: -1 });
    const newOrder = lastSmartLink ? lastSmartLink.order + 1 : 0;

    // Mettre à jour le SmartLink
    smartLink.folder = finalFolderId ? new mongoose.Types.ObjectId(finalFolderId) : null;
    smartLink.order = newOrder;
    await smartLink.save();

    res.status(200).json({
      message: "✅ SmartLink déplacé avec succès",
      data: smartLink,
    });
  } catch (error) {
    console.error("❌ Erreur lors du déplacement du SmartLink :", error);
    res.status(400).json({
      message: "Erreur lors du déplacement du SmartLink",
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

    // ✅ Supprimer l'entrée d'origine
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