const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");
const jwt = require("jsonwebtoken");
const getWeekNumber = require("../../utils/getWeekNumber");

const criminalReport = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    const { platform, period } = req.query;

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Get the current date
    const now = new Date();

    // Get the current month and year
    const month = now.getMonth() + 1; // Months are zero-indexed, so add 1
    const year = now.getFullYear();

    let since;
    const until = now;

    if (period === "weekly") {
      // get data in 1 month
      // Construct the first date of the month
      since = new Date(
        `${year}-${String(month).padStart(2, "0")}-01T00:00:00Z`
      );
    } else if (period === "monthly") {
      since = new Date(`${year}-01-01T00:00:00Z`);
    } else if (period === "yearly") {
      // get data for the past 5 years
      const sinceYear = year - 5;
      since = new Date(`${sinceYear}-01-01T00:00:00Z`);
    }

    // console.log("🚀 ~ criminalReport ~ since:", since);
    // console.log("🚀 ~ criminalReport ~ until:", until);

    if (platform === "news") {
      const filter = await prisma.filter.findMany({
        where: {
          is_active: true,
          user_id: decoded.id,
          Platform: {
            name: "News",
          },
          Category: {
            name: "Keyword",
          },
        },
      });

      let allNews = [];

      if (filter.length > 0) {
        await Promise.all(
          filter.map(async (f) => {
            const news = await prisma.News.findMany({
              where: {
                title: {
                  contains: f.parameter,
                },
                published_at: {
                  gte: since,
                  lte: until,
                },
              },
            });

            // if news length 0 dont include in the array
            if (news.length === 0) return [];

            news.forEach((n) => {
              allNews.push(n);
            });

            return {
              news,
            };
          })
        );
      }

      const countsByYear = allNews.reduce((acc, post) => {
        const date = new Date(post.published_at);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        let weekNumber = getWeekNumber(date);
        // if (weekNumber > 4) weekNumber = 1;
        if (!acc[year]) acc[year] = {};
        if (!acc[year][month]) acc[year][month] = {};
        if (!acc[year][month][weekNumber]) acc[year][month][weekNumber] = 0;
        acc[year][month][weekNumber]++;
        return acc;
      }, {});
      // console.log("🚀 ~ countsByYear ~ countsByYear:", countsByYear);

      res.json({
        message: "Data has been fetched",
        statusCode: 200,
        data: countsByYear,
        post: allNews,
      });
    } else if (platform === "facebook") {
      const facebook_access_token = req.cookies.facebook_access_token;

      if (!facebook_access_token) {
        return res.status(400).json({
          error: "Bad Request",
          message:
            "Please go to connect account before you can see social media dashboard",
        });
      }

      // convert since into UNIX timecode
      const sinceUnix = Math.floor(since.getTime() / 1000);
      const untilUnix = Math.floor(until.getTime() / 1000);

      const filter = await prisma.Filter.findMany({
        where: {
          is_active: true,
          user_id: decoded.id,
          Platform: {
            name: "Facebook",
          },
        },
      });

      let allPosts = [];

      if (filter.length > 0) {
        await Promise.all(
          filter.map(async (f) => {
            const page_token = await axios.get(
              `https://graph.facebook.com/v19.0/${f.id}`,
              {
                params: {
                  fields: "access_token",
                  access_token: facebook_access_token,
                },
              }
            );

            const posts = await axios.get(
              `https://graph.facebook.com/v19.0/${f.id}/tagged`,
              {
                params: {
                  fields: `id, message, created_time, permalink_url`,
                  since: sinceUnix,
                  until: untilUnix,
                  access_token: page_token.data.access_token,
                },
              }
            );

            if (posts.data.data.length === 0) return [];

            posts.data.data.forEach((p) => {
              allPosts.push(p);
            });
          })
        );
      }

      // console.log("🚀 ~ criminalReport ~ allPosts:", allPosts);

      const countsByYear = allPosts.reduce((acc, post) => {
        const date = new Date(post.created_time);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        let weekNumber = getWeekNumber(date);
        if (!acc[year]) acc[year] = {};
        if (!acc[year][month]) acc[year][month] = {};
        if (!acc[year][month][weekNumber]) acc[year][month][weekNumber] = 0;
        acc[year][month][weekNumber]++;
        return acc;
      }, {});

      res.json({
        message: "Data has been fetched",
        statusCode: 200,
        data: countsByYear,
        post: allPosts,
      });
    } else if (platform === "instagram") {
      const facebook_access_token = req.cookies.facebook_access_token;

      if (!facebook_access_token) {
        return res.status(400).json({
          error: "Bad Request",
          message:
            "Please go to connect account before you can see social media dashboard",
        });
      }

      // convert since into UNIX timecode
      const sinceUnix = Math.floor(since.getTime() / 1000);
      const untilUnix = Math.floor(until.getTime() / 1000);

      let allPosts = [];

      const mentionFilter = await prisma.Filter.findMany({
        where: {
          is_active: true,
          user_id: decoded.id,
          Platform: {
            name: "Instagram",
          },
          Category: {
            name: "Mention",
          },
        },
      });

      if (mentionFilter.length > 0) {
        await Promise.all(
          mentionFilter.map(async (f) => {
            const posts = await axios.get(
              `https://graph.facebook.com/v19.0/${f.id}/tags`,
              {
                params: {
                  fields: "timestamp",
                  access_token: facebook_access_token,
                },
              }
            );

            posts.data.data.forEach((p) => {
              allPosts.push(p);
            });
          })
        );
      }

      // console.log("🚀 ~ criminalReport ~ allPosts:", allPosts);

      const hashtagFilter = await prisma.Filter.findMany({
        where: {
          is_active: true,
          user_id: decoded.id,
          Platform: {
            name: "Instagram",
          },
          Category: {
            name: "Hashtag",
          },
        },
      });

      if (hashtagFilter.length > 0) {
        await Promise.all(
          hashtagFilter.map(async (f) => {
            const hashtagId = await axios.get(
              `https://graph.facebook.com/v19.0/ig_hashtag_search`,
              {
                params: {
                  user_id: mentionFilter[0].id,
                  q: f.parameter,
                  access_token: facebook_access_token,
                },
              }
            );

            const posts = await axios.get(
              `https://graph.facebook.com/v19.0/${hashtagId.data.data[0].id}/recent_media`,
              {
                params: {
                  user_id: mentionFilter[0].id,
                  fields: "timestamp",
                  access_token: facebook_access_token,
                },
              }
            );

            if (posts.data.data.length === 0) return [];

            posts.data.data.forEach((p) => {
              allPosts.push(p);
            });
          })
        );
      }

      const allPostsInRange = allPosts.filter((post) => {
        const postTimestamp = new Date(post.timestamp);
        const sinceDate = new Date(since);
        const untilDate = new Date(until);
        return postTimestamp >= sinceDate && postTimestamp <= untilDate;
      });

      const countsByYear = allPostsInRange.reduce((acc, post) => {
        const date = new Date(post.timestamp);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        let weekNumber = getWeekNumber(date);
        if (!acc[year]) acc[year] = {};
        if (!acc[year][month]) acc[year][month] = {};
        if (!acc[year][month][weekNumber]) acc[year][month][weekNumber] = 0;
        acc[year][month][weekNumber]++;
        return acc;
      }, {});

      res.json({
        message: "Data has been fetched",
        statusCode: 200,
        data: countsByYear,
        post: allPostsInRange,
      });
    }
  } catch (error) {
    res.status(400).json({
      error: "An error has occurred",
      message: error.message,
    });
  }
};

module.exports = criminalReport;
