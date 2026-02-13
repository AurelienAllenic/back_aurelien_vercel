const SmartLink = require("../models/SmartLink");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// ✅ Ajouter un lien avec ordre automatique
exports.addSmartLink = async (req, res) => {
  const { title, linkType, titleType, modifiedTitle, link } = req.body;

  if (!title || !linkType || !titleType || !modifiedTitle || !link) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    // Déterminer l'ordre automatiquement
    const lastSmartLink = await SmartLink.findOne().sort({ order: -1 });
    const newOrder = lastSmartLink ? lastSmartLink.order + 1 : 0;

    const newSmartLink = new SmartLink({
      id: uuidv4(),
      title,
      linkType,
      titleType,
      modifiedTitle,
      link,
      order: newOrder, // ✅ Ajout de l'ordre
    });
    await newSmartLink.save();
    res
      .status(201)
      .json({ message: "SmartLink créé avec succès", data: newSmartLink });
  } catch (error) {
    console.error("Erreur backend :", error);
    res.status(400).json({
      message: "Erreur lors de la création de la radio",
      error: error.message,
    });
  }
};

// ✅ Récupérer tous les SmartLinks triés par ordre
exports.findAllSmartLinks = async (req, res) => {
  try {
    const smartLinks = await SmartLink.find().sort({ order: 1 });
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
    const smartLink = await SmartLink.findById(id);
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

    const updatedSmartLink = await SmartLink.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedSmartLink) {
      return res.status(404).json({ message: "SmartLink non trouvé." });
    }

    res.status(200).json({
      message: "SmartLink mis à jour avec succès",
      data: updatedSmartLink,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error);
    res.status(400).json({
      message: "Erreur lors de la mise à jour du SmartLink",
      error: error.message,
    });
  }
};

// ✅ **Mettre à jour l'ordre des SmartLinks V1**
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
    const smartLinkDocs = await SmartLink.find();

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
        const swappedSmartLink = await SmartLink.findOne({ order: newOrder });

        if (swappedSmartLink) {
          await SmartLink.updateOne(
            { _id: swappedSmartLink._id },
            { $set: { order: oldOrder } }
          );
        }

        await SmartLink.updateOne(
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

exports.deleteSmartLink = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const result = await SmartLink.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "SmartLink non trouvé." });
    }

    res.status(200).json({ message: "SmartLink supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression du SmartLink : ", error);
    res.status(400).json({
      message: "Erreur lors de la suppression du SmartLink",
      error: error.message,
    });
  }
};