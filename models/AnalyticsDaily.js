const mongoose = require("mongoose");

const AnalyticsDailySchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  pageViews: { type: Number, default: 0 },
  clicks: { type: Map, of: Number, default: {} },
  uniqueVisitors: { type: Number, default: 0 },
  visitorIds: { type: [String], default: [] },
});

module.exports = mongoose.model("AnalyticsDaily", AnalyticsDailySchema);
