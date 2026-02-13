const Folder = require("../models/Folder");
const mongoose = require("mongoose");
const SmartLinkV2 = require("../models/SmartLinkV2");
const Trash = require("../models/Trash");

// ✅ Ajouter un dossier
exports.addFolder = async (req, res) => {
  console.log("📥 Données reçues :", req.body);
  const { title, parentFolder } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Le titre du dossier est requis." });
  }

  try {
    // Déterminer l'ordre automatiquement
    const lastFolder = await Folder.findOne(
      parentFolder ? { parentFolder } : { parentFolder: null }
    ).sort({ order: -1 });
    const newOrder = lastFolder ? lastFolder.order + 1 : 0;

    const newFolder = new Folder({
      title,
      parentFolder: parentFolder
        ? new mongoose.Types.ObjectId(parentFolder)
        : null,
      order: newOrder,
    });

    await newFolder.save();

    // ✅ Si c'est un sous-dossier, on met à jour le dossier parent pour l'ajouter comme enfant
    if (parentFolder) {
      await Folder.findByIdAndUpdate(parentFolder, {
        $push: { children: newFolder._id },
      });
    }

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
    const folders = await Folder.find()
      .populate("smartLinks")
      .populate("parentFolder")
      .populate("children")
      .sort({ order: 1 });

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

// ✅ **Mettre à jour l'ordre des dossiers**
exports.updateOrder = async (req, res) => {
  try {
    const { orderedFolders } = req.body;
    if (!Array.isArray(orderedFolders)) {
      console.error("❌ ERREUR: orderedFolders doit être un tableau !");
      return res
        .status(400)
        .json({ error: "orderedFolders doit être un tableau" });
    }

    const currentOrders = {};
    const folderDocs = await Folder.find();

    folderDocs.forEach((doc) => {
      currentOrders[doc._id.toString()] = doc.order;
    });

    for (const folder of orderedFolders) {
      const { _id, order: newOrder } = folder;

      if (!mongoose.Types.ObjectId.isValid(_id)) {
        console.error(`❌ ID invalide : ${_id}`);
        return res.status(400).json({ error: `ID invalide : ${_id}` });
      }

      const oldOrder = currentOrders[_id];

      if (oldOrder !== newOrder) {
        const swappedFolder = await Folder.findOne({ order: newOrder });

        if (swappedFolder) {
          await Folder.updateOne(
            { _id: swappedFolder._id },
            { $set: { order: oldOrder } }
          );
        }

        await Folder.updateOne(
          { _id: new mongoose.Types.ObjectId(_id) },
          { $set: { order: newOrder } }
        );
      }
    }

    const updatedFolders = await Folder.find().sort({ order: 1 });
    res.json({ message: "Ordre mis à jour avec succès !" });
  } catch (error) {
    console.error("❌ Erreur serveur dans updateOrder :", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Supprimer un dossier
exports.deleteFolder = async (req, res) => {
  const { id } = req.params;
  const { deleteSmartLinks } = req.body;

  console.log("📥 Suppression du dossier :", id);
  console.log("📌 Supprimer les SmartLinks associés ?", deleteSmartLinks);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    // Récupérer tous les sous-dossiers récursivement
    const getAllSubfolders = async (folderId) => {
      let subfolders = await Folder.find({ parentFolder: folderId });
      for (const subfolder of subfolders) {
        const nestedSubfolders = await getAllSubfolders(subfolder._id);
        subfolders = subfolders.concat(nestedSubfolders);
      }
      return subfolders;
    };

    const subfolders = await getAllSubfolders(id);
    const allFolderIds = [id, ...subfolders.map((folder) => folder._id)];

    console.log("📌 Dossiers supprimés :", allFolderIds);

    if (!deleteSmartLinks) {
      // Détacher les SmartLinks des dossiers supprimés
      await SmartLinkV2.updateMany(
        { folder: { $in: allFolderIds } },
        { $unset: { folder: 1 } }
      );
      console.log("✅ SmartLinks détachés des dossiers supprimés.");
    } else {
      // Récupérer les SmartLinks à supprimer
      const smartLinksToDelete = await SmartLinkV2.find({
        folder: { $in: allFolderIds },
      });

      // Pour chaque SmartLink, la déplacer dans la corbeille puis supprimer
      for (const smartLink of smartLinksToDelete) {
        // Sauvegarder dans la corbeille
        await Trash.create({
          entityType: "SmartLinkV2",
          originalId: smartLink._id,
          data: smartLink.toObject(),
        });
        // Supprimer l'entrée d'origine
        await SmartLinkV2.deleteOne({ _id: smartLink._id });
      }

      console.log("✅ SmartLinks déplacés à la corbeille avec leurs dossiers.");
    }

    // Supprimer tous les sous-dossiers + le dossier cible
    await Folder.deleteMany({ _id: { $in: allFolderIds } });

    res
      .status(200)
      .json({ message: "Dossier et sous-dossiers supprimés avec succès." });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du dossier :", error);
    res.status(400).json({
      message: "Erreur lors de la suppression du dossier",
      error: error.message,
    });
  }
};