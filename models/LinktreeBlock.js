const mongoose = require("mongoose");

const linktreeBlockSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["video", "ep", "live", "link", "embed", "image", "single", "title"],
      required: true,
    },
    // Contenu flexible selon le type
    content: {
      // Pour type: "link"
      url: String,
      buttonText: String,
      
      // Pour type: "video" (embed YouTube, etc.)
      videoUrl: String,
      thumbnail: String,
      
      // Pour type: "ep" ou "live" (référence à un document existant)
      refType: String, // "Ep", "Live", "Single"
      refId: mongoose.Schema.Types.ObjectId,
      
      // Pour type: "embed" (iframe HTML brut)
      embedCode: String,
      
      // Pour type: "image"
      imageUrl: String,
      linkUrl: String,
    },
    // Style personnalisé (optionnel)
    style: {
      backgroundColor: String,
      textColor: String,
      borderColor: String,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LinktreeBlock", linktreeBlockSchema);