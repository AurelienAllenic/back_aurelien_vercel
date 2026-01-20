const mongoose = require("mongoose");

const liveSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true, // Ensures unique display order
    },
    title: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    lieu: {
      type: String,
      required: false,
    },
    isActive: {type: Boolean,default: true,},
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("Live", liveSchema);