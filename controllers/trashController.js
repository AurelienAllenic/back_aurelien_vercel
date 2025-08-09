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
    console.log("📥 Restoring item with ID:", req.params.id);

    const trashItem = await Trash.findById(req.params.id);
    if (!trashItem) {
      console.log("❌ Trash item not found:", req.params.id);
      return res
        .status(404)
        .json({ message: "Élément introuvable dans la corbeille" });
    }

    const { entityType, data, originalId } = trashItem;
    console.log("📌 Entity type:", entityType, "Original ID:", originalId);

    const Model = modelsMap[entityType];
    if (!Model) {
      console.log("❌ Unknown entity type:", entityType);
      return res
        .status(400)
        .json({ message: "Type d'entité inconnu : " + entityType });
    }

    // Check if the item already exists
    const exists = await Model.findById(originalId);
    if (exists) {
      console.log("❌ Item already exists:", originalId);
      return res
        .status(409)
        .json({ message: `${entityType} existe déjà avec cet ID` });
    }

    // Restore the item
    console.log("📌 Restoring item data:", data);
    await Model.create({ ...data, _id: originalId });

    // Clean invalid references
    const FolderModel = mongoose.model("Folder");

    if (entityType === "SmartLinkV2" || entityType === "SmartLink") {
      if (data.folder) {
        console.log("📌 Checking folder reference:", data.folder);
        const folderExists = await FolderModel.exists({ _id: data.folder });
        if (!folderExists) {
          console.log(
            "📌 Folder does not exist, unsetting folder:",
            data.folder
          );
          await Model.updateOne({ _id: originalId }, { $unset: { folder: 1 } });
        }
      }
    } else if (entityType === "Folder") {
      if (data.parentFolder) {
        console.log("📌 Checking parentFolder reference:", data.parentFolder);
        const parentExists = await FolderModel.exists({
          _id: data.parentFolder,
        });
        if (!parentExists) {
          console.log(
            "📌 Parent folder does not exist, unsetting parentFolder:",
            data.parentFolder
          );
          await Model.updateOne(
            { _id: originalId },
            { $unset: { parentFolder: 1 } }
          );
        }
      }

      if (data.children && Array.isArray(data.children)) {
        console.log("📌 Checking children references:", data.children);
        const validChildren = await FolderModel.find({
          _id: { $in: data.children },
        }).select("_id");
        const validIds = validChildren.map((c) => c._id.toString());
        const cleanedChildren = data.children.filter((c) =>
          validIds.includes(c.toString())
        );
        if (cleanedChildren.length !== data.children.length) {
          console.log("📌 Updating children to:", cleanedChildren);
          await Model.updateOne(
            { _id: originalId },
            { $set: { children: cleanedChildren } }
          );
        }
      }
    }

    // Delete from Trash
    await Trash.findByIdAndDelete(req.params.id);
    console.log("✅ Item restored and removed from trash:", originalId);

    res.status(200).json({ message: `${entityType} restauré avec succès` });
  } catch (err) {
    console.error("❌ Error during restoration:", err);
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
