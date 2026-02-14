const getMessageModel = require("../models/Message");
const mongoose = require("mongoose");
const { decrypt } = require("../utils/encryption");

exports.findAllMessages = async (req, res) => {
  try {
    const Message = await getMessageModel();
    if (!Message) {
      return res.status(503).json({
        message: "Service temporairement indisponible",
        error: "Modèle Message non disponible",
      });
    }
    const messages = await Message.find().sort({ createdAt: -1 });

    const decryptedMessages = messages.map((msg, index) => {
      try {
        const originalEmail = msg.email;
        const originalMessage = msg.message;

        const decryptedEmail = decrypt(msg.email);
        const decryptedMessage = decrypt(msg.message);

        if (decryptedEmail === originalEmail) {
          console.warn(`⚠️ [Messages] Email non déchiffré pour message ${index + 1} (ID: ${msg._id})`);
        }
        if (decryptedMessage === originalMessage) {
          console.warn(`⚠️ [Messages] Message non déchiffré pour message ${index + 1} (ID: ${msg._id})`);
        }

        return {
          ...msg.toObject(),
          email: decryptedEmail,
          message: decryptedMessage,
        };
      } catch (decryptError) {
        console.error(`❌ [Messages] Erreur déchiffrement message ${index + 1} (ID: ${msg._id}):`, decryptError);
        return {
          ...msg.toObject(),
          email: msg.email,
          message: msg.message,
        };
      }
    });

    res.status(200).json({ message: "Liste des messages", data: decryptedMessages });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des messages :", error);
    res.status(400).json({
      message: "Erreur lors de la récupération des messages",
      error: error.message,
    });
  }
};

exports.findOneMessage = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const Message = await getMessageModel();
    if (!Message) {
      return res.status(503).json({
        message: "Service temporairement indisponible",
        error: "Modèle Message non disponible",
      });
    }
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: "Message non trouvé." });
    }

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

exports.deleteMessage = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide." });
  }

  try {
    const Message = await getMessageModel();
    if (!Message) {
      return res.status(503).json({
        message: "Service temporairement indisponible",
        error: "Modèle Message non disponible",
      });
    }
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
