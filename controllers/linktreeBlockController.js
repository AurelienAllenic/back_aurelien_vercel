const LinktreeBlock = require("../models/LinktreeBlock");

// Récupérer tous les blocs actifs (pour le frontend public)
exports.getAllActiveBlocks = async (req, res) => {
    try {
      const blocks = await LinktreeBlock.find({ isActive: true })
        .sort({ order: 1 })
        .lean();
      
      // Populate les références (EP, Single, Live, Video)
      const Ep = require('../models/Ep');
      const Single = require('../models/Single');
      const Live = require('../models/Live');
      const Video = require('../models/Videos');
      
      const populatedBlocks = await Promise.all(
        blocks.map(async (block) => {
          if (block.content?.refId && block.content?.refType) {
            let refData = null;
            
            switch (block.content.refType) {
              case 'Ep':
                refData = await Ep.findById(block.content.refId).lean();
                break;
              case 'Single':
                refData = await Single.findById(block.content.refId).lean();
                break;
              case 'Live':
                refData = await Live.findById(block.content.refId).lean();
                break;
              case 'Video':
                refData = await Video.findById(block.content.refId).lean();
                break;
            }
            
            if (refData) {
              block.content.populatedData = refData;
            }
          }
          return block;
        })
      );
      
      res.status(200).json(populatedBlocks);
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
    const { order } = req.body;
    
    // Gestion du conflit d'ordre (comme pour les singles avec index)
    if (order !== undefined) {
      const newOrder = parseInt(order);
      if (!isNaN(newOrder) && newOrder >= 0) {
        const existingBlock = await LinktreeBlock.findOne({ order: newOrder });
        if (existingBlock) {
          // Trouver le prochain ordre disponible
          const maxOrderBlock = await LinktreeBlock.findOne()
            .sort({ order: -1 })
            .select("order");
          const nextOrder = maxOrderBlock ? maxOrderBlock.order + 1 : 0;
          
          // Décaler le bloc existant
          await LinktreeBlock.updateOne(
            { _id: existingBlock._id },
            { $set: { order: nextOrder } }
          );
        }
      }
    }
    
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
    const { order } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }
    
    const existingBlock = await LinktreeBlock.findById(id);
    if (!existingBlock) {
      return res.status(404).json({ error: "Bloc non trouvé" });
    }
    
    const updateData = { ...req.body };
    
    // Gestion du conflit d'ordre lors de la mise à jour
    if (order !== undefined) {
      const newOrder = parseInt(order);
      if (!isNaN(newOrder) && newOrder >= 0) {
        const existingBlockWithOrder = await LinktreeBlock.findOne({ order: newOrder });
        if (
          existingBlockWithOrder &&
          existingBlockWithOrder._id.toString() !== id
        ) {
          // Trouver le prochain ordre disponible
          const maxOrderBlock = await LinktreeBlock.findOne()
            .sort({ order: -1 })
            .select("order");
          const nextOrder = maxOrderBlock ? maxOrderBlock.order + 1 : 0;
          
          // Décaler le bloc existant
          await LinktreeBlock.updateOne(
            { _id: existingBlockWithOrder._id },
            { $set: { order: nextOrder } }
          );
        }
        updateData.order = newOrder;
      }
    }
    
    const updatedBlock = await LinktreeBlock.findByIdAndUpdate(
      id,
      { $set: updateData },
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