const mongoose = require("mongoose");

const TrashSchema = new mongoose.Schema(
  {
    entityType: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    originalId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Trash", TrashSchema);
