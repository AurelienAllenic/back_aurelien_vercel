const mongoose = require("mongoose");
const Live = require("../models/Live");

// Ajouter un Live
exports.addLive = async (req, res) => {
  const { id, title, link, date, isActive } = req.body;

  // Vérifier les champs obligatoires
  if (!id || !title || !link || !date) {
    return res
      .status(400)
      .json({ message: "Tous les champs obligatoires doivent être remplis." });
  }

  try {
    // Convertir id en nombre
    const newId = parseInt(id);
    if (isNaN(newId) || newId < 1) {
      return res
        .status(400)
        .json({ message: "L'id doit être un nombre positif." });
    }

    // Vérifier si l'id existe déjà
    const existingLive = await Live.findOne({ id: newId });
    if (existingLive) {
      // Trouver le prochain id disponible
      const maxIdLive = await Live.findOne().sort({ id: -1 }).select("id");
      const nextId = maxIdLive ? maxIdLive.id + 1 : 1;

      // Mettre à jour le Live existant avec le prochain id
      await Live.updateOne(
        { _id: existingLive._id },
        { $set: { id: nextId } }
      );
    }

    const newLive = new Live({
      id: newId,
      title,
      link,
      date,
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
    });

    await newLive.save();

    res.status(201).json({ message: "✅ Live créé avec succès", data: newLive });
  } catch (error) {
    console.error("❌ Erreur lors de la création du Live :", error);
    res.status(400).json({
      message: "Erreur lors de la création du Live",
      error: error.message,
    });
  }
};

// Récupérer tous les Lives (pour le frontend public - uniquement actifs)
exports.findAllLives = async (req, res) => {
  try {
    const lives = await Live.find({ isActive: true }).sort({ id: 1 });
    res.status(200).json({ message: "Liste des Lives", data: lives });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des Lives :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération des Lives",
      error: error.message,
    });
  }
};

// Récupérer tous les Lives (pour le backoffice - actifs et inactifs)
exports.findAllLivesAdmin = async (req, res) => {
  try {
    const lives = await Live.find().sort({ id: 1 });
    res.status(200).json({ message: "Liste des Lives", data: lives });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des Lives :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération des Lives",
      error: error.message,
    });
  }
};

// Récupérer un Live par ID
exports.findOneLive = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const live = await Live.findById(id);
    if (!live) {
      return res.status(404).json({ message: "Live non trouvé." });
    }

    res.status(200).json({ message: "Live trouvé", data: live });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du Live :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération du Live",
      error: error.message,
    });
  }
};

// Mettre à jour un Live
exports.updateLive = async (req, res) => {
  const { id } = req.params; // MongoDB _id
  const { orderId, title, link, date, isActive } = req.body; // Use orderId to avoid confusion with MongoDB _id

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID invalide." });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (link) updateData.link = link;
    if (date) updateData.date = date;
    if (isActive !== undefined) {
      updateData.isActive = isActive === "true" || isActive === true;
    }

    // Gérer l'id (display order) si fourni
    if (orderId !== undefined) {
      const parsedId = parseInt(orderId);
      if (isNaN(parsedId) || parsedId < 1) {
        return res
          .status(400)
          .json({ message: "L'id doit être un nombre positif." });
      }

      const existingLiveWithId = await Live.findOne({ id: parsedId });
      if (existingLiveWithId && existingLiveWithId._id.toString() !== id) {
        // Trouver le prochain id disponible
        const maxIdLive = await Live.findOne().sort({ id: -1 }).select("id");
        const nextId = maxIdLive ? maxIdLive.id + 1 : 1;

        // Mettre à jour le Live existant avec le prochain id
        await Live.updateOne(
          { _id: existingLiveWithId._id },
          { $set: { id: nextId } }
        );
      }
      updateData.id = parsedId;
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "Aucune donnée à mettre à jour." });
    }

    const updatedLive = await Live.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedLive) {
      return res.status(404).json({ message: "Live non trouvé." });
    }

    res.status(200).json({
      message: "Live mis à jour avec succès",
      data: updatedLive,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du Live :", error);
    res.status(400).json({
      message: "Erreur lors de la mise à jour du Live",
      error: error.message,
    });
  }
};

// Supprimer un Live
exports.deleteLive = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const live = await Live.findById(id);
    if (!live) {
      return res.status(404).json({ message: "Live non trouvé." });
    }

    const result = await Live.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Live non trouvé." });
    }

    res.status(200).json({ message: "✅ Live supprimé avec succès." });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du Live :", error);
    res.status(400).json({
      message: "Erreur lors de la suppression du Live",
      error: error.message,
    });
  }
};