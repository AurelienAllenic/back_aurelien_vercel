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

// Fonction pour obtenir le modèle avec la bonne connexion (async pour attendre la connexion si nécessaire)
const getMessageModel = async () => {
  let aurelienConnection = getAurelienConnection();
  
  // Si la connexion n'existe pas ou n'est pas prête, essayer de se connecter
  if (!aurelienConnection || aurelienConnection.readyState !== 1) {
    console.log('🔄 [Message] Connexion non prête, tentative de connexion...');
    const { connectDBAurelien } = require("../config/dbAurelien");
    aurelienConnection = await connectDBAurelien();
    
    // Si la connexion est en cours (readyState === 2), attendre qu'elle se termine
    if (aurelienConnection && aurelienConnection.readyState === 2) {
      console.log('🔄 [Message] Connexion en cours, attente jusqu\'à 6 secondes...');
      await new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 60; // 60 * 100ms = 6 secondes
        
        const checkConnection = setInterval(() => {
          attempts++;
          const state = aurelienConnection.readyState;
          
          if (state === 1) {
            // Connecté !
            console.log('✅ [Message] Connexion établie après attente');
            clearInterval(checkConnection);
            resolve();
          } else if (state === 0 || attempts >= maxAttempts) {
            // Déconnecté ou timeout
            console.log(`⚠️ [Message] Connexion non établie (état: ${state}, tentatives: ${attempts})`);
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
      });
    }
  }
  
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
    console.warn('⚠️ [Message] Connexion Aurelien non disponible après tentative de connexion');
  }
  
  // ⚠️ IMPORTANT: Ne pas utiliser le fallback sur la connexion par défaut
  // Si la connexion Aurelien n'est pas disponible, on ne peut pas créer le message
  console.error('❌ [Message] Impossible de créer le message : connexion Aurelien non disponible');
  return null; // Retourner null pour indiquer que le modèle n'est pas disponible
};

module.exports = getMessageModel;
