const Section = require("../models/Section");
const mongoose = require("mongoose");

// Ajouter une section
exports.addSection = async (req, res) => {
  const { title, isActive } = req.body;

  if (!title) {
    return res.status(400).json({
      message: "Le titre est requis.",
    });
  }

  try {
    // Vérifier si une section avec ce titre existe déjà
    const existingSection = await Section.findOne({ title });
    if (existingSection) {
      return res.status(400).json({
        message: "Une section avec ce titre existe déjà.",
      });
    }

    const newSection = new Section({
      title,
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
    });

    await newSection.save();

    res
      .status(201)
      .json({ message: "✅ Section créée avec succès", data: newSection });
  } catch (error) {
    console.error("❌ Erreur lors de la création de la section :", error);
    res.status(400).json({
      message: "Erreur lors de la création de la section",
      error: error.message,
    });
  }
};

// Récupérer toutes les sections (pour le frontend public - uniquement actives)
exports.findAllSections = async (req, res) => {
  try {
    const sections = await Section.find({ isActive: true }).sort({ title: 1 });
    res.status(200).json({ message: "Liste des sections", data: sections });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des sections :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération des sections",
      error: error.message,
    });
  }
};

// Récupérer toutes les sections (pour le backoffice - actives et inactives)
exports.findAllSectionsAdmin = async (req, res) => {
  try {
    const sections = await Section.find().sort({ title: 1 });
    res.status(200).json({ message: "Liste des sections", data: sections });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des sections :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération des sections",
      error: error.message,
    });
  }
};

// Récupérer une section par ID
exports.findOneSection = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({ message: "Section non trouvée." });
    }

    res.status(200).json({ message: "Section trouvée", data: section });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la section :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération de la section",
      error: error.message,
    });
  }
};

// Mettre à jour une section
exports.updateSection = async (req, res) => {
  const { id } = req.params;
  const { title, isActive } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID invalide." });
    }

    const existingSection = await Section.findById(id);
    if (!existingSection) {
      return res.status(404).json({ message: "Section non trouvée." });
    }

    const updateData = {};

    // Mise à jour des champs
    if (title !== undefined) {
      // Vérifier si un autre titre avec ce nom existe déjà
      const sectionWithSameTitle = await Section.findOne({ title });
      if (sectionWithSameTitle && sectionWithSameTitle._id.toString() !== id) {
        return res.status(400).json({
          message: "Une section avec ce titre existe déjà.",
        });
      }
      updateData.title = title;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive === "true" || isActive === true;
    }

    // Vérifier qu'il y a des données à mettre à jour
    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "Aucune donnée à mettre à jour." });
    }

    const updatedSection = await Section.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "✅ Section mise à jour avec succès",
      data: updatedSection,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la section :", error);
    res.status(400).json({
      message: "Erreur lors de la mise à jour de la section",
      error: error.message,
    });
  }
};

// Supprimer une section
exports.deleteSection = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({ message: "Section non trouvée." });
    }

    const result = await Section.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Section non trouvée." });
    }

    res.status(200).json({ message: "✅ Section supprimée avec succès." });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la section :", error);
    res.status(400).json({
      message: "Erreur lors de la suppression de la section",
      error: error.message,
    });
  }
};
