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

// Fonction pour obtenir le modèle avec la bonne connexion
const getUserAurelienModel = () => {
  const connection = getAurelienConnection();
  if (!connection) {
    throw new Error("Connexion MongoDB Aurelien non disponible");
  }
  
  // Vérifier si le modèle existe déjà sur cette connexion
  if (connection.models.UserAurelien) {
    return connection.models.UserAurelien;
  }
  
  return connection.model("UserAurelien", UserAurelienSchema);
};

module.exports = getUserAurelienModel;
