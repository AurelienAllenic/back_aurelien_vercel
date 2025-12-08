const LinktreeBlock = require("../models/LinktreeBlock");

// Récupérer tous les blocs actifs (pour le frontend public)
exports.getAllActiveBlocks = async (req, res) => {
  try {
    const blocks = await LinktreeBlock.find({ isActive: true })
      .sort({ order: 1 })
      .lean();
    
    res.status(200).json(blocks);
  } catch (error) {
    console.error("Erreur récupération blocs linktree:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Récupérer tous les blocs (pour l'admin)
exports.getAllBlocks = async (req, res) => {
  try {
    const blocks = await LinktreeBlock.find()
      .sort({ order: 1 })
      .lean();
    
    res.status(200).json(blocks);
  } catch (error) {
    console.error("Erreur récupération blocs:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Créer un nouveau bloc
exports.createBlock = async (req, res) => {
  try {
    const newBlock = new LinktreeBlock(req.body);
    await newBlock.save();
    
    res.status(201).json({ 
      success: true, 
      message: "Bloc créé avec succès", 
      block: newBlock 
    });
  } catch (error) {
    console.error("Erreur création bloc:", error);
    res.status(500).json({ error: "Erreur lors de la création" });
  }
};

// Mettre à jour un bloc
exports.updateBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBlock = await LinktreeBlock.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedBlock) {
      return res.status(404).json({ error: "Bloc non trouvé" });
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Bloc mis à jour", 
      block: updatedBlock 
    });
  } catch (error) {
    console.error("Erreur mise à jour bloc:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
};

// Supprimer un bloc
exports.deleteBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBlock = await LinktreeBlock.findByIdAndDelete(id);
    
    if (!deletedBlock) {
      return res.status(404).json({ error: "Bloc non trouvé" });
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Bloc supprimé" 
    });
  } catch (error) {
    console.error("Erreur suppression bloc:", error);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
};

// Réorganiser les blocs (changer l'ordre)
exports.reorderBlocks = async (req, res) => {
  try {
    const { blocks } = req.body; // Array d'objets { id, order }
    
    const updatePromises = blocks.map(({ id, order }) =>
      LinktreeBlock.findByIdAndUpdate(id, { order })
    );
    
    await Promise.all(updatePromises);
    
    res.status(200).json({ 
      success: true, 
      message: "Ordre mis à jour" 
    });
  } catch (error) {
    console.error("Erreur réorganisation:", error);
    res.status(500).json({ error: "Erreur lors de la réorganisation" });
  }
};