const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema({
  title: { type: String, required: true },
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null,
  },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Folder" }],
});

module.exports = mongoose.model("Folder", folderSchema);
