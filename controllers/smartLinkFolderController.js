const Folder = require("../models/Folder");
const mongoose = require("mongoose");
const SmartLinkV2 = require("../models/SmartLinkV2");

// ✅ Ajouter un dossier
exports.addFolder = async (req, res) => {
  console.log("📥 Données reçues :", req.body);
  const { title, parentFolder } = req.body;

  if (!title) {
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
// ✅ Récupérer tous les dossiers avec leurs relations
exports.findAllFolders = async (req, res) => {
  try {
    const folders = await Folder.find()
      .populate("smartLinks") // Populate les SmartLinks associés
      .populate("parentFolder") // Populate le dossier parent
      .populate("children"); // Populate les sous-dossiers

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

exports.deleteFolder = async (req, res) => {
  const { id } = req.params;
  const { deleteSmartLinks } = req.body;
  console.log("📥 Suppression du dossier :", id);
  console.log("📌 Supprimer les SmartLinks associés ?", deleteSmartLinks);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }
  try {
    const folderId = new mongoose.Types.ObjectId(id);
    const folder = await Folder.findById(folderId);
    if (!folder) {
      console.log("Folder not found:", id);
      return res.status(404).json({ message: "Dossier non trouvé." });
    }
    if (deleteSmartLinks === "onlyFolderWithTrash") {
      const [linksV2, linksV1] = await Promise.all([
        SmartLinkV2.find({ folder: folderId }),
      ]);
      const trashData = [
        ...linksV2.map((doc) => ({
          entityType: "SmartLinkV2",
          originalId: doc._id,
          data: doc.toObject(),
        })),
        ...linksV1.map((doc) => ({
          entityType: "SmartLink",
          originalId: doc._id,
          data: doc.toObject(),
        })),
      ];
      if (trashData.length > 0) {
        await Trash.insertMany(trashData);
      }
      await Promise.all([SmartLinkV2.deleteMany({ folder: folderId })]);
      await Folder.updateMany(
        { parentFolder: folderId },
        { $unset: { parentFolder: 1 } }
      );
      await Folder.deleteOne({ _id: folderId });
      console.log(
        "✅ Dossier supprimé, SmartLinks envoyés à la corbeille, sous-dossiers conservés."
      );
      return res.status(200).json({
        message:
          "Dossier supprimé, SmartLinks envoyés à la corbeille, sous-dossiers conservés.",
      });
    }
    const getAllSubfolders = async (folderId) => {
      let subfolders = await Folder.find({ parentFolder: folderId });
      let allSubfolders = [...subfolders];
      for (const subfolder of subfolders) {
        const nested = await getAllSubfolders(subfolder._id);
        allSubfolders = allSubfolders.concat(nested);
      }
      return allSubfolders;
    };
    const subfolders = await getAllSubfolders(folderId);
    const allFolderIds = [folderId, ...subfolders.map((f) => f._id)];
    console.log("📌 Dossiers supprimés :", allFolderIds);
    if (deleteSmartLinks === false) {
      await Promise.all([
        SmartLinkV2.updateMany(
          { folder: { $in: allFolderIds } },
          { $unset: { folder: 1 } }
        ),
      ]);
      console.log("✅ SmartLinks détachés des dossiers supprimés.");
    }
    if (deleteSmartLinks === true) {
      const [linksV2, linksV1] = await Promise.all([
        SmartLinkV2.find({ folder: { $in: allFolderIds } }),
      ]);
      const trashData = [
        ...linksV2.map((doc) => ({
          entityType: "SmartLinkV2",
          originalId: doc._id,
          data: doc.toObject(),
        })),
        ...linksV1.map((doc) => ({
          entityType: "SmartLink",
          originalId: doc._id,
          data: doc.toObject(),
        })),
      ];
      if (trashData.length > 0) {
        await Trash.insertMany(trashData);
      }
      await Promise.all([
        SmartLinkV2.deleteMany({ folder: { $in: allFolderIds } }),
      ]);
    }
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
