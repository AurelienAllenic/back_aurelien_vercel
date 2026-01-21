const { getAurelienConnection } = require("../config/dbAurelien");
const mongoose = require("mongoose");

const messageSchemaDefinition = {
  email: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  send: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
};

// Fonction pour obtenir le modèle avec la bonne connexion
const getMessageModel = () => {
  const aurelienConnection = getAurelienConnection();
  
  // Si connexion Aurelien disponible, l'utiliser
  if (aurelienConnection) {
    // Vérifier si le modèle existe déjà sur cette connexion
    if (aurelienConnection.models.Message) {
      return aurelienConnection.models.Message;
    }
    // Utiliser mongoose.Schema pour créer le schéma, puis la connexion pour créer le modèle
    const schema = new mongoose.Schema(messageSchemaDefinition, {
      timestamps: true,
    });
    return aurelienConnection.model("Message", schema);
  }
  
  // Fallback sur la connexion par défaut
  if (mongoose.models.Message) {
    return mongoose.models.Message;
  }
  const schema = new mongoose.Schema(messageSchemaDefinition, {
    timestamps: true,
  });
  return mongoose.model("Message", schema);
};

module.exports = getMessageModel;
