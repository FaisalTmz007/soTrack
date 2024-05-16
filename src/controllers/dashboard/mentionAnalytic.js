const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");
const jwt = require("jsonwebtoken");

const mentionAnalytic = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    const facebookAccessToken = req.cookies.facebook_access_token;
    const { interval } = req.query; // Assuming the interval is passed as a query parameter

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    // console.log("🚀 ~ socialMediaMention ~ decoded:", decoded);

    const keywordNews = await prisma.filter.findMany({
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
    // console.log("🚀 ~ mentionAnalytic ~ keywordNews:", keywordNews);

    const mentionFacebook = await prisma.Filter.findMany({
      where: {
        is_active: true,
        user_id: decoded.id,
        Platform: {
          name: "Facebook",
        },
        Category: {
          name: "Mention",
        },
      },
    });

    const mentionPost = await Promise.all(
      mentionFacebook.map(async (mf) => {
        try {
          const { data: pageData } = await axios.get(
            `https://graph.facebook.com/v19.0/${mf.id}`,
            {
              params: {
                fields: "access_token,instagram_business_account",
                access_token: facebookAccessToken,
              },
            }
          );

          const { data: pageMentionData } = await axios.get(
            `https://graph.facebook.com/v19.0/${mf.id}/tagged`,
            {
              params: {
                fields: "message,from,created_time",
                access_token: pageData.access_token,
              },
            }
          );

          const socialMedia = {};

          const pageMentions = pageMentionData.data
            ? pageMentionData.data.map((item) => item.created_time)
            : [];
          const instagramMentions = [];

          if (pageData.instagram_business_account) {
            const { data: instagramData } = await axios.get(
              `https://graph.facebook.com/v19.0/${pageData.instagram_business_account.id}/tags`,
              {
                params: {
                  fields: "timestamp",
                  access_token: facebookAccessToken,
                },
              }
            );
            instagramMentions.push(
              ...(instagramData.data
                ? instagramData.data.map((item) => item.timestamp)
                : [])
            );
          }

          if (pageMentions.length > 0 || instagramMentions.length > 0) {
            socialMedia.mergedMentions = [
              ...pageMentions,
              ...instagramMentions,
            ];
          }

          return socialMedia;
        } catch (error) {
          console.error("Error fetching data:", error);
          return {
            error: error.message,
          };
        }
      })
    );

    // Aggregate the mentions by year, month, and week
    const aggregateMentions = (mentions, acc) => {
      mentions.forEach((timestamp) => {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const weekNumber = getWeekNumber(date);

        if (!acc[year]) acc[year] = {};
        if (!acc[year][month]) acc[year][month] = {};
        if (!acc[year][month][weekNumber]) acc[year][month][weekNumber] = 0;
        acc[year][month][weekNumber]++;
      });
    };

    const socialMediaAggregated = {};

    mentionPost.forEach((post) => {
      if (post.error) {
        socialMediaAggregated.error = post.error;
      } else {
        if (post.mergedMentions) {
          aggregateMentions(post.mergedMentions, socialMediaAggregated);
        }
      }
    });

    // Determine the date range based on the interval
    let dateRange;
    const now = new Date();
    if (interval === "weekly") {
      dateRange = new Date(now.setMonth(now.getMonth() - 1));
    } else if (interval === "monthly") {
      dateRange = new Date(now.setFullYear(now.getFullYear() - 1));
    } else if (interval === "yearly") {
      dateRange = new Date(now.setFullYear(now.getFullYear() - 5));
    } else {
      dateRange = new Date(now.setDate(now.getDate() - 7)); // Default to last week if no valid interval is provided
    }

    const newsResults = await Promise.all(
      keywordNews.length === 0
        ? [prisma.News.findMany({})]
        : keywordNews.map(async (nf) => {
            const news = await prisma.News.findMany({
              where: {
                title: {
                  contains: nf.parameter,
                },
                published_at: {
                  gte: dateRange,
                  lte: new Date(),
                },
              },
            });
            return news;
          })
    );

    // console.log(newsResults);

    const flattenedNewsResults =
      keywordNews.length === 0 ? newsResults[0] : newsResults.flat();

    const countsByYear = flattenedNewsResults.reduce((acc, post) => {
      const date = new Date(post.published_at);
      // console.log("🚀 ~ data.forEach ~ date:", date);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const weekNumber = getWeekNumber(date);

      // console.log("🚀 ~ aggregateByInterval ~ year:", year);
      // console.log("🚀 ~ aggregateByInterval ~ month:", month);
      // console.log("🚀 ~ aggregateByInterval ~ weekNumber:", weekNumber);

      if (!acc[year]) acc[year] = {};
      if (!acc[year][month]) acc[year][month] = {};
      if (!acc[year][month][weekNumber]) acc[year][month][weekNumber] = 0;
      acc[year][month][weekNumber]++;
      return acc;
    }, {});

    res.json({
      message: "Data has been retrieved successfully",
      statusCode: 200,
      data: {
        socialMedia: socialMediaAggregated,
        news: countsByYear,
      },
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occurred",
      message: error.message,
    });
  }
};

// Function to get the week number of a given date
function getWeekNumber(date) {
  const oneJan = new Date(date.getFullYear(), 0, 1);
  const millisecondsInDay = 86400000;
  return Math.ceil(
    ((date - oneJan) / millisecondsInDay + oneJan.getDay() + 1) / 7
  );
}

module.exports = mentionAnalytic;
