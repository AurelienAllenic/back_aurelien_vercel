const mongoose = require("mongoose");

const PressSchema = new mongoose.Schema({
  image: { type: String, required: true },
  link: { type: String, default: "" },
  linkMobile: { type: String, default: "" }, // optionnel : version mobile du lien
  alt: { type: String, required: true },
  /** Affichage : section (par défaut) ou revue */
  kind: {
    type: String,
    enum: ["section", "revue"],
    default: "section",
  },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Press", PressSchema);
