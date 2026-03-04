const Analytics = require('../models/Analytics');
const AnalyticsDaily = require('../models/AnalyticsDaily');
const AnalyticsMonthly = require('../models/AnalyticsMonthly');
const AnalyticsYearly = require('../models/AnalyticsYearly');


async function aggregateDailyStats() {
  try {
    const events = await Analytics.find({});

    if (events.length === 0) {
      return { 
        eventsProcessed: 0,
        deletedCount: 0,
        message: 'Aucune donnée à agréger'
      };
    }

    const eventsByDate = {};
    
    events.forEach(event => {
      const eventDate = new Date(event.createdAt);
      const dateString = eventDate.toISOString().split('T')[0];
      
      if (!eventsByDate[dateString]) {
        eventsByDate[dateString] = [];
      }
      eventsByDate[dateString].push(event);
    });

    const results = [];
    
    for (const [dateString, dayEvents] of Object.entries(eventsByDate)) {
      const pageViews = dayEvents.filter(e => e.type === 'PAGE_VIEW').length;
      const clicks = {};
      const visitorIds = new Set();

      dayEvents.forEach(event => {
        visitorIds.add(event.visitorId);
        if (event.type === 'CLICK' && event.label) {
          clicks[event.label] = (clicks[event.label] || 0) + 1;
        }
      });

      const existing = await AnalyticsDaily.findOne({ date: dateString });
      
      let finalPageViews = pageViews;
      let finalClicks = { ...clicks };
      let finalVisitorIds = new Set(visitorIds);

      if (existing) {
        finalPageViews += existing.pageViews;
        
        if (existing.clicks) {
          existing.clicks.forEach((count, label) => {
            finalClicks[label] = (finalClicks[label] || 0) + count;
          });
        }
        
        (existing.visitorIds || []).forEach(id => finalVisitorIds.add(id));
      }

      await AnalyticsDaily.findOneAndUpdate(
        { date: dateString },
        {
          pageViews: finalPageViews,
          clicks: finalClicks,
          uniqueVisitors: finalVisitorIds.size,
          visitorIds: Array.from(finalVisitorIds)
        },
        { upsert: true, new: true }
      );

      results.push({
        date: dateString,
        eventsProcessed: dayEvents.length,
        pageViews: finalPageViews,
        uniqueVisitors: finalVisitorIds.size
      });
    }

    const deleteResult = await Analytics.deleteMany({});

    return {
      eventsProcessed: events.length,
      deletedCount: deleteResult.deletedCount,
      daysAggregated: results.length,
      details: results,
      message: 'Aggregation completed successfully'
    };

  } catch (error) {
    console.error('❌ Aggregation error:', error);
    throw error;
  }
}


async function aggregateMonthlyStats(year, month) {
  try {
    const monthString = String(month).padStart(2, '0');
    const prefix = `${year}-${monthString}-`;

    const days = await AnalyticsDaily.find({ date: { $regex: `^${prefix}` } }).sort({ date: 1 });

    if (days.length === 0) {
      return { year, month, daysCount: 0, deletedDays: 0, message: 'Aucune donnée quotidienne' };
    }

    const dailyStats = days.map(day => ({
      date: day.date,
      pageViews: day.pageViews,
      clicks: day.clicks,
      uniqueVisitors: day.uniqueVisitors,
      visitorIds: day.visitorIds
    }));

    let pageViews = 0;
    const clicks = {};
    const visitorIdsSet = new Set();

    days.forEach(day => {
      pageViews += day.pageViews || 0;
      if (day.clicks) {
        day.clicks.forEach((count, label) => {
          clicks[label] = (clicks[label] || 0) + count;
        });
      }
      (day.visitorIds || []).forEach(id => visitorIdsSet.add(id));
    });

    const uniqueVisitors = visitorIdsSet.size;
    const visitorIds = Array.from(visitorIdsSet);

    const doc = await AnalyticsMonthly.findOneAndUpdate(
      { year, month },
      {
        pageViews,
        clicks,
        uniqueVisitors,
        visitorIds,
        dailyStats
      },
      { upsert: true, new: true }
    );

    const deleteResult = await AnalyticsDaily.deleteMany({ date: { $regex: `^${prefix}` } });

    return { year, month, daysCount: days.length, pageViews, uniqueVisitors, deletedDays: deleteResult.deletedCount, doc };
  } catch (error) {
    console.error('❌ Erreur agrégation mensuelle :', error);
    throw error;
  }
}


async function aggregateYearlyStats(year) {
  try {
    const months = await AnalyticsMonthly.find({ year }).sort({ month: 1 });

    if (months.length === 0) {
      return { year, monthsCount: 0, deletedMonths: 0, message: 'Aucune donnée mensuelle' };
    }

    const monthlyStats = months.map(m => ({
      month: m.month,
      pageViews: m.pageViews,
      clicks: m.clicks,
      uniqueVisitors: m.uniqueVisitors,
      visitorIds: m.visitorIds,
      dailyStats: m.dailyStats
    }));

    let pageViews = 0;
    const clicks = {};
    const visitorIdsSet = new Set();

    months.forEach(m => {
      pageViews += m.pageViews || 0;
      if (m.clicks) {
        m.clicks.forEach((count, label) => {
          clicks[label] = (clicks[label] || 0) + count;
        });
      }
      (m.visitorIds || []).forEach(id => visitorIdsSet.add(id));
    });

    const uniqueVisitors = visitorIdsSet.size;
    const visitorIds = Array.from(visitorIdsSet);

    const doc = await AnalyticsYearly.findOneAndUpdate(
      { year },
      {
        pageViews,
        clicks,
        uniqueVisitors,
        visitorIds,
        monthlyStats
      },
      { upsert: true, new: true }
    );

    const deleteResult = await AnalyticsMonthly.deleteMany({ year });

    return { year, monthsCount: months.length, pageViews, uniqueVisitors, deletedMonths: deleteResult.deletedCount, doc };
  } catch (error) {
    console.error('❌ Erreur agrégation annuelle :', error);
    throw error;
  }
}

module.exports = {
  aggregateDailyStats,
  aggregateMonthlyStats,
  aggregateYearlyStats,
};
