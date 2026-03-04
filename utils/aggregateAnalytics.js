const Analytics = require("../models/Analytics");
const AnalyticsDaily = require("../models/AnalyticsDaily");
const AnalyticsMonthly = require("../models/AnalyticsMonthly");
const AnalyticsYearly = require("../models/AnalyticsYearly");

function clicksToObject(clicks) {
  if (!clicks) return {};
  if (clicks instanceof Map) return Object.fromEntries(clicks);
  return typeof clicks === "object" ? clicks : {};
}

// Même logique que back_aurelienallenicfr : agrège tous les events, puis supprime
async function aggregateDailyStats() {
  try {
    const events = await Analytics.find({});

    if (events.length === 0) {
      return {
        eventsProcessed: 0,
        deletedCount: 0,
        message: "Aucune donnée à agréger",
      };
    }

    const eventsByDate = {};
    events.forEach((event) => {
      const eventDate = new Date(event.createdAt);
      const dateString = eventDate.toISOString().split("T")[0];
      if (!eventsByDate[dateString]) eventsByDate[dateString] = [];
      eventsByDate[dateString].push(event);
    });

    const results = [];
    for (const [dateString, dayEvents] of Object.entries(eventsByDate)) {
      const pageViews = dayEvents.filter((e) => e.type === "PAGE_VIEW").length;
      const pageViewsByPath = {};
      dayEvents.forEach((event) => {
        if (event.type === "PAGE_VIEW" && event.path) {
          const p = event.path || "/";
          pageViewsByPath[p] = (pageViewsByPath[p] || 0) + 1;
        }
      });
      const clicks = {};
      const visitorIds = new Set();
      dayEvents.forEach((event) => {
        visitorIds.add(event.visitorId);
        if (event.type === "CLICK" && event.label) clicks[event.label] = (clicks[event.label] || 0) + 1;
        if (event.type === "SECTION_VIEW" && event.label) clicks[event.label] = (clicks[event.label] || 0) + 1;
      });

      const existing = await AnalyticsDaily.findOne({ date: dateString });
      let finalPageViews = pageViews;
      const finalPageViewsByPath = { ...pageViewsByPath };
      const finalClicks = { ...clicks };
      const finalVisitorIds = new Set(visitorIds);

      if (existing) {
        finalPageViews += existing.pageViews || 0;
        Object.entries(existing.pageViewsByPath || {}).forEach(([path, count]) => {
          finalPageViewsByPath[path] = (finalPageViewsByPath[path] || 0) + count;
        });
        const prevClicks = clicksToObject(existing.clicks);
        Object.entries(prevClicks).forEach(([label, count]) => {
          finalClicks[label] = (finalClicks[label] || 0) + count;
        });
        (existing.visitorIds || []).forEach((id) => finalVisitorIds.add(id));
      }

      await AnalyticsDaily.findOneAndUpdate(
        { date: dateString },
        {
          pageViews: finalPageViews,
          pageViewsByPath: finalPageViewsByPath,
          clicks: finalClicks,
          uniqueVisitors: finalVisitorIds.size,
          visitorIds: Array.from(finalVisitorIds),
        },
        { upsert: true, new: true }
      );
      results.push({ date: dateString, eventsProcessed: dayEvents.length, pageViews: finalPageViews, uniqueVisitors: finalVisitorIds.size });
    }

    const deleteResult = await Analytics.deleteMany({});
    return {
      eventsProcessed: events.length,
      deletedCount: deleteResult.deletedCount,
      daysAggregated: results.length,
      details: results,
      message: "Aggregation completed successfully",
    };
  } catch (error) {
    console.error("❌ Aggregation error:", error);
    throw error;
  }
}

async function aggregateMonthlyStats(year, month) {
  try {
    const monthString = String(month).padStart(2, "0");
    const prefix = `${year}-${monthString}-`;
    const days = await AnalyticsDaily.find({ date: { $regex: `^${prefix}` } }).sort({ date: 1 });

    if (days.length === 0) {
      return { year, month, daysCount: 0, deletedDays: 0, message: "Aucune donnée quotidienne" };
    }

    const dailyStats = days.map((day) => ({
      date: day.date,
      pageViews: day.pageViews,
      pageViewsByPath: day.pageViewsByPath || {},
      clicks: clicksToObject(day.clicks),
      uniqueVisitors: day.uniqueVisitors,
      visitorIds: day.visitorIds || [],
    }));

    let pageViews = 0;
    const clicks = {};
    const visitorIdsSet = new Set();
    days.forEach((day) => {
      pageViews += day.pageViews || 0;
      Object.entries(clicksToObject(day.clicks)).forEach(([label, count]) => {
        clicks[label] = (clicks[label] || 0) + count;
      });
      (day.visitorIds || []).forEach((id) => visitorIdsSet.add(id));
    });

    await AnalyticsMonthly.findOneAndUpdate(
      { year, month },
      {
        pageViews,
        clicks,
        uniqueVisitors: visitorIdsSet.size,
        visitorIds: Array.from(visitorIdsSet),
        dailyStats,
      },
      { upsert: true, new: true }
    );
    const deleteResult = await AnalyticsDaily.deleteMany({ date: { $regex: `^${prefix}` } });
    return { year, month, daysCount: days.length, pageViews, uniqueVisitors: visitorIdsSet.size, deletedDays: deleteResult.deletedCount };
  } catch (error) {
    console.error("❌ Erreur agrégation mensuelle :", error);
    throw error;
  }
}

async function aggregateYearlyStats(year) {
  try {
    const months = await AnalyticsMonthly.find({ year }).sort({ month: 1 });
    if (months.length === 0) {
      return { year, monthsCount: 0, deletedMonths: 0, message: "Aucune donnée mensuelle" };
    }

    const monthlyStats = months.map((m) => ({
      month: m.month,
      pageViews: m.pageViews,
      clicks: clicksToObject(m.clicks),
      uniqueVisitors: m.uniqueVisitors,
      visitorIds: m.visitorIds || [],
      dailyStats: (m.dailyStats || []).map((d) => ({
        date: d.date,
        pageViews: d.pageViews,
        pageViewsByPath: d.pageViewsByPath || {},
        clicks: clicksToObject(d.clicks),
        uniqueVisitors: d.uniqueVisitors,
        visitorIds: d.visitorIds || [],
      })),
    }));

    let pageViews = 0;
    const clicks = {};
    const visitorIdsSet = new Set();
    months.forEach((m) => {
      pageViews += m.pageViews || 0;
      Object.entries(clicksToObject(m.clicks)).forEach(([label, count]) => {
        clicks[label] = (clicks[label] || 0) + count;
      });
      (m.visitorIds || []).forEach((id) => visitorIdsSet.add(id));
    });

    await AnalyticsYearly.findOneAndUpdate(
      { year },
      { pageViews, clicks, uniqueVisitors: visitorIdsSet.size, visitorIds: Array.from(visitorIdsSet), monthlyStats },
      { upsert: true, new: true }
    );
    const deleteResult = await AnalyticsMonthly.deleteMany({ year });
    return { year, monthsCount: months.length, pageViews, uniqueVisitors: visitorIdsSet.size, deletedMonths: deleteResult.deletedCount };
  } catch (error) {
    console.error("❌ Erreur agrégation annuelle :", error);
    throw error;
  }
}

module.exports = {
  aggregateDailyStats,
  aggregateMonthlyStats,
  aggregateYearlyStats,
};
