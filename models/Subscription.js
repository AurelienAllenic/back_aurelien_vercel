const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
    },
    // "newsletter" ou "mailingList"
    type: {
      type: String,
      enum: ["newsletter", "mailingList"],
      required: true,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      default: "site",
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ email: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);

