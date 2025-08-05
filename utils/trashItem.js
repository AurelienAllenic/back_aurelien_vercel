const Trash = require("../models/Trash");

async function trashItem(model, id, entityType) {
  const item = await model.findById(id);
  if (!item) throw new Error(`${entityType} introuvable`);

  // Crée une entrée dans Trash
  await Trash.create({
    entityType,
    originalId: item._id,
    data: item.toObject(),
  });

  // Supprime l'entrée originale
  await model.findByIdAndDelete(id);
}

module.exports = trashItem;
