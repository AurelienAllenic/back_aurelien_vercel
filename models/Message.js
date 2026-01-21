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
    console.warn('⚠️ [Message] État de la connexion:', {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[aurelienConnection.readyState] || 'unknown');
  } else {
    console.warn('⚠️ [Message] Connexion Aurelien non disponible');
  }
  
  // ⚠️ IMPORTANT: Ne pas utiliser le fallback sur la connexion par défaut
  // Si la connexion Aurelien n'est pas disponible, on ne peut pas créer le message
  // Cela évite de mélanger les données entre les deux bases
  if (!aurelienConnection || aurelienConnection.readyState !== 1) {
    console.error('❌ [Message] Impossible de créer le message : connexion Aurelien non disponible');
    return null; // Retourner null pour indiquer que le modèle n'est pas disponible
  }
  
  // Si on arrive ici, c'est une erreur de logique
  console.error('❌ [Message] Erreur de logique : connexion Aurelien devrait être disponible');
  return null;
};

module.exports = getMessageModel;
