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
    smartLinks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SmartLinkV2",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Folder", FolderSchema);
