const getMessageModel = require("../models/Message");
const mongoose = require("mongoose");
const { decrypt } = require("../utils/encryption");

// Récupérer tous les messages
exports.findAllMessages = async (req, res) => {
  try {
    const Message = await getMessageModel();
    const messages = await Message.find().sort({ createdAt: -1 });
    
    // Déchiffrer les messages pour l'affichage
    const decryptedMessages = messages.map(msg => ({
      ...msg.toObject(),
      email: decrypt(msg.email),
      message: decrypt(msg.message),
    }));
    
    res.status(200).json({ message: "Liste des messages", data: decryptedMessages });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des messages :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération des messages",
      error: error.message,
    });
  }
};

// Récupérer un message par ID
exports.findOneMessage = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const Message = await getMessageModel();
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: "Message non trouvé." });
    }

    // Déchiffrer le message pour l'affichage
    const decryptedMessage = {
      ...message.toObject(),
      email: decrypt(message.email),
      message: decrypt(message.message),
    };

    res.status(200).json({ message: "Message trouvé", data: decryptedMessage });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du message :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération du message",
      error: error.message,
    });
  }
};

// Supprimer un message
exports.deleteMessage = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const Message = await getMessageModel();
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: "Message non trouvé." });
    }

    const result = await Message.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Message non trouvé." });
    }

    res.status(200).json({ message: "✅ Message supprimé avec succès." });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du message :", error);
    res.status(400).json({
      message: "Erreur lors de la suppression du message",
      error: error.message,
    });
  }
};
