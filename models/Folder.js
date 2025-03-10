const mongoose = require("mongoose");

const FolderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Folder",
      },
    ], // ✅ On garde les enfants ajoutés
    smartLinks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SmartLinkV2",
      },
    ], // ✅ On remet les smartLinks
  },
  { timestamps: true }
);

module.exports = mongoose.model("Folder", FolderSchema);
