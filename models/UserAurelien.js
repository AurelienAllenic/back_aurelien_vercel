const mongoose = require("mongoose");
const { getAurelienConnection } = require("../config/dbAurelien");
const bcrypt = require("bcryptjs");

const UserAurelienSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: false // Optionnel car OAuth n'a pas de password
  },
  googleId: { 
    type: String, 
    unique: true, 
    sparse: true // Permet plusieurs null
  },
  name: { 
    type: String 
  },
  picture: { 
    type: String 
  },
  authMethod: { 
    type: String, 
    enum: ["email", "google"], 
    required: true 
  },
  role: { 
    type: String, 
    default: "user", 
    enum: ["user", "admin"] 
  },
}, {
  timestamps: true
});

// Hash password before saving it (seulement si password fourni)
UserAurelienSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Comparing password
UserAurelienSchema.methods.comparePassword = async function (password) {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

// Fonction pour obtenir le modèle avec la bonne connexion (async pour attendre la connexion si nécessaire)
const getUserAurelienModel = async () => {
  let connection = getAurelienConnection();
  
  // Si la connexion n'existe pas ou n'est pas prête, essayer de se connecter
  if (!connection || connection.readyState !== 1) {
    const { connectDBAurelien } = require("../config/dbAurelien");
    connection = await connectDBAurelien();
    
    // Si toujours pas prête après connexion, attendre un peu
    if (connection && connection.readyState === 2) {
      await new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 60; // 60 * 100ms = 6 secondes
        
        const checkConnection = setInterval(() => {
          attempts++;
          const state = connection.readyState;
          
          if (state === 1) {
            clearInterval(checkConnection);
            resolve();
          } else if (state === 0 || attempts >= maxAttempts) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
      });
    }
  }
  
  if (!connection || connection.readyState !== 1) {
    throw new Error("Connexion MongoDB Aurelien non disponible");
  }
  
  // Vérifier si le modèle existe déjà sur cette connexion
  if (connection.models.UserAurelien) {
    return connection.models.UserAurelien;
  }
  
  return connection.model("UserAurelien", UserAurelienSchema);
};

module.exports = getUserAurelienModel;
