const Analytics = require("../models/Analytics");
const AnalyticsDaily = require("../models/AnalyticsDaily");
const AnalyticsMonthly = require("../models/AnalyticsMonthly");
const AnalyticsYearly = require("../models/AnalyticsYearly");
const crypto = require("crypto");
const {
  aggregateDailyStats,
  aggregateMonthlyStats,
  aggregateYearlyStats,
} = require("../utils/aggregateAnalytics");

exports.trackEvent = async (req, res) => {
  try {
    const { type, path, label, metadata } = req.body;
    if (!type) {
      return res.status(400).json({ error: "Type is required" });
    }
    const salt = process.env.ANALYTICS_SALT || "paro_analytics_salt";
    const ip =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.socket.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    const visitorId = crypto
      .createHash("sha256")
      .update(ip + userAgent + salt)
      .digest("hex")
      .substring(0, 16);

    const newEvent = new Analytics({
      visitorId,
      type,
      path: path || "/",
      label: label || null,
      metadata: metadata || {},
    });
    await newEvent.save();
    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("❌ Analytics error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getDailyStats = async (req, res) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;
    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }
    const stats = await AnalyticsDaily.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit, 10));
    res.json(stats);
  } catch (error) {
    console.error("❌ Get daily stats error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getMonthlyStats = async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!year) {
      return res.status(400).json({ error: "year est requis" });
    }
    const filter = { year: parseInt(year, 10) };
    if (month) filter.month = parseInt(month, 10);
    const stats = await AnalyticsMonthly.find(filter).sort({ year: -1, month: -1 });
    res.json(stats);
  } catch (error) {
    console.error("❌ Get monthly stats error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getYearlyStats = async (req, res) => {
  try {
    const { year } = req.query;
    const filter = {};
    if (year) filter.year = parseInt(year, 10);
    const stats = await AnalyticsYearly.find(filter).sort({ year: -1 });
    res.json(stats);
  } catch (error) {
    console.error("❌ Get yearly stats error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.aggregateDaily = async (req, res) => {
  try {
    const result = await aggregateDailyStats();
    res.json({ success: true, result });
  } catch (error) {
    console.error("❌ Aggregate error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { type, limit = 100 } = req.query;
    const filter = type ? { type } : {};
    const events = await Analytics.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    const stats = await Analytics.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 }, uniqueVisitors: { $addToSet: "$visitorId" } } },
      { $project: { type: "$_id", count: 1, uniqueVisitors: { $size: "$uniqueVisitors" } } },
    ]);

    const topClicks = await Analytics.aggregate([
      { $match: { type: "CLICK" } },
      { $group: { _id: "$label", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({ events, stats, topClicks });
  } catch (error) {
    console.error("❌ Get analytics error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.cronAggregateDaily = async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("❌ CRON_SECRET not configured");
      return res.status(500).json({ error: "Cron not configured" });
    }
    if (req.query.secret !== cronSecret) {
      console.error("❌ Invalid cron secret");
      return res.status(401).json({ error: "Unauthorized" });
    }
    const result = await aggregateDailyStats();
    res.status(200).json({ success: true, result, message: "Cron aggregation completed" });
  } catch (error) {
    console.error("❌ Cron aggregate error:", error);
    res.status(500).json({ error: "Aggregation failed", details: error.message });
  }
};

exports.cronAggregateMonthly = async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("❌ CRON_SECRET not configured");
      return res.status(500).json({ error: "Cron not configured" });
    }
    if (req.query.secret !== cronSecret) {
      console.error("❌ Invalid cron secret (monthly)");
      return res.status(401).json({ error: "Unauthorized" });
    }
    let year = req.query.year ? parseInt(req.query.year, 10) : null;
    let month = req.query.month ? parseInt(req.query.month, 10) : null;
    if (!year || !month) {
      const d = new Date();
      d.setUTCMonth(d.getUTCMonth() - 1);
      year = d.getUTCFullYear();
      month = d.getUTCMonth() + 1;
    }
    const result = await aggregateMonthlyStats(year, month);
    res.status(200).json({
      success: true,
      scope: "monthly",
      year,
      month,
      result,
      message: "Cron monthly aggregation completed",
    });
  } catch (error) {
    console.error("❌ Cron monthly aggregate error:", error);
    res.status(500).json({ error: "Monthly aggregation failed", details: error.message });
  }
};

exports.cronAggregateYearly = async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("❌ CRON_SECRET not configured");
      return res.status(500).json({ error: "Cron not configured" });
    }
    if (req.query.secret !== cronSecret) {
      console.error("❌ Invalid cron secret (yearly)");
      return res.status(401).json({ error: "Unauthorized" });
    }
    let year = req.query.year ? parseInt(req.query.year, 10) : null;
    if (!year) {
      const d = new Date();
      year = d.getUTCFullYear() - 1;
    }
    const result = await aggregateYearlyStats(year);
    res.status(200).json({
      success: true,
      scope: "yearly",
      year,
      result,
      message: "Cron yearly aggregation completed",
    });
  } catch (error) {
    console.error("❌ Cron yearly aggregate error:", error);
    res.status(500).json({ error: "Yearly aggregation failed", details: error.message });
  }
};
