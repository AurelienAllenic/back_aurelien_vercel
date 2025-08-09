const Trash = require("../models/Trash");

// Map des entités Mongoose par type
const modelsMap = {
  SmartLink: require("../models/SmartLink"),
  SmartLinkV2: require("../models/SmartLinkV2"),
  Video: require("../models/Videos"),
  Bio: require("../models/Bio"),
  Ep: require("../models/Ep"),
  Live: require("../models/Live"),
  Press: require("../models/Press"),
  Radio: require("../models/Radio"),
  Single: require("../models/Single"),
  SocialLinks: require("../models/SocialLinks"),
};

/**
 * Liste tous les éléments dans la corbeille
 */
exports.getAllTrashedItems = async (req, res) => {
  try {
    const items = await Trash.find().sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({
      message: "Erreur lors de la récupération de la corbeille",
      error: err.message,
    });
  }
};

/**
 * Restaure un élément de la corbeille
 */
exports.restoreItem = async (req, res) => {
  try {
    const trashItem = await Trash.findById(req.params.id);
    if (!trashItem)
      return res
        .status(404)
        .json({ message: "Élément introuvable dans la corbeille" });
    const { entityType, data, originalId } = trashItem;
    const Model = modelsMap[entityType];
    if (!Model)
      return res
        .status(400)
        .json({ message: "Type d'entité inconnu : " + entityType });
    // On vérifie que l'élément n'existe pas déjà
    const exists = await Model.findById(originalId);
    if (exists)
      return res
        .status(409)
        .json({ message: `${entityType} existe déjà avec cet ID` });
    // On restaure l'élément supprimé
    await Model.create({ ...data, _id: originalId });
    // Nettoyage des références invalides
    const FolderModel = mongoose.model("Folder");
    if (entityType === "SmartLinkV2" || entityType === "SmartLink") {
      if (data.folder) {
        const folderExists = await FolderModel.exists({ _id: data.folder });
        if (!folderExists) {
          await Model.updateOne({ _id: originalId }, { $unset: { folder: 1 } });
        }
      }
    } else if (entityType === "Folder") {
      if (data.parentFolder) {
        const parentExists = await FolderModel.exists({
          _id: data.parentFolder,
        });
        if (!parentExists) {
          await Model.updateOne(
            { _id: originalId },
            { $unset: { parentFolder: 1 } }
          );
        }
      }
      // Nettoyage optionnel des enfants invalides
      if (data.children && Array.isArray(data.children)) {
        const validChildren = await FolderModel.find({
          _id: { $in: data.children },
        }).select("_id");
        const validIds = validChildren.map((c) => c._id.toString());
        const cleanedChildren = data.children.filter((c) =>
          validIds.includes(c.toString())
        );
        if (cleanedChildren.length !== data.children.length) {
          await Model.updateOne(
            { _id: originalId },
            { $set: { children: cleanedChildren } }
          );
        }
      }
    }
    await Trash.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: `${entityType} restauré avec succès` });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur lors de la restauration", error: err.message });
  }
};

/**
 * Supprime définitivement un élément de la corbeille
 */
exports.permanentlyDeleteItem = async (req, res) => {
  try {
    const deleted = await Trash.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Élément non trouvé" });

    res.status(200).json({ message: "Élément supprimé définitivement" });
  } catch (err) {
    res.status(500).json({
      message: "Erreur lors de la suppression définitive",
      error: err.message,
    });
  }
};
