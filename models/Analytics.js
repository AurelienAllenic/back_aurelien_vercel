const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  visitorId: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['PAGE_VIEW', 'CLICK', 'SECTION_VIEW', 'DURATION'], 
    required: true 
  },
  path: String,
  label: String,
  metadata: Object,
  createdAt: { 
    type: Date,
    default: Date.now,
    index: true,
    expires: 604800
    }
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);
