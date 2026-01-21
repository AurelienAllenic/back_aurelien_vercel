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
  
  // Si connexion Aurelien disponible et prête, l'utiliser
  if (aurelienConnection && aurelienConnection.readyState === 1) {
    // Vérifier si le modèle existe déjà sur cette connexion
    if (aurelienConnection.models.Message) {
      console.log('📦 [Message] Utilisation du modèle existant sur connexion Aurelien');
      return aurelienConnection.models.Message;
    }
    // Utiliser mongoose.Schema pour créer le schéma, puis la connexion pour créer le modèle
    const schema = new mongoose.Schema(messageSchemaDefinition, {
      timestamps: true,
    });
    console.log('📦 [Message] Création du modèle sur connexion Aurelien');
    return aurelienConnection.model("Message", schema);
  }
  
  if (aurelienConnection) {
    console.warn('⚠️ [Message] Connexion Aurelien existe mais n\'est pas prête (readyState:', aurelienConnection.readyState, ')');
  } else {
    console.warn('⚠️ [Message] Connexion Aurelien non disponible, utilisation de la connexion par défaut');
  }
  
  // Fallback sur la connexion par défaut
  if (mongoose.models.Message) {
    console.log('📦 [Message] Utilisation du modèle sur connexion par défaut');
    return mongoose.models.Message;
  }
  const schema = new mongoose.Schema(messageSchemaDefinition, {
    timestamps: true,
  });
  console.log('📦 [Message] Création du modèle sur connexion par défaut');
  return mongoose.model("Message", schema);
};

module.exports = getMessageModel;
