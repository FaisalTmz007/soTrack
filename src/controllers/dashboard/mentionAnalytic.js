const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");
const jwt = require("jsonwebtoken");
const getWeekNumber = require("../../utils/getWeekNumber");

const mentionAnalytic = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken)
      return res.status(400).json({
        error: "Please login first",
      });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const { platform, period } = req.query;

    if (!platform || !period) {
      return res.status(400).json({
        message: "Please provide platform and period query parameters",
      });
    }

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
    } else {
      return res.status(400).json({
        message: "Please provide a valid period",
      });
    }

    if (platform === "news") {
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

      let allNews = [];

      if (keywordNews.length > 0) {
        await Promise.all(
          keywordNews.map(async (mf) => {
            try {
              const news = await prisma.News.findMany({
                where: {
                  title: {
                    contains: mf.parameter,
                  },
                  published_at: {
                    gte: since,
                    lte: until,
                  },
                },
              });

              if (news.length === 0) return [];

              news.forEach((n) => {
                allNews.push(n);
              });

              return news;
            } catch (error) {
              return [];
            }
          })
        );
      }

      const countsByYear = allNews.reduce((acc, post) => {
        const date = new Date(post.published_at);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // months are 0-indexed
        const weekNumber = getWeekNumber(date); // Assuming getWeekNumber is defined

        if (!acc[year]) acc[year] = {};
        if (!acc[year][month]) acc[year][month] = {};
        if (!acc[year][month][weekNumber]) acc[year][month][weekNumber] = 0;
        acc[year][month][weekNumber]++;
        return acc;
      }, {});

      return res.status(200).json({
        message: "Data has been retrieved successfully",
        statusCode: 200,
        data: countsByYear,
      });
    } else if (platform === "facebook" || platform === "instagram") {
      const facebookAccessToken = req.cookies.facebook_access_token;

      if (!facebookAccessToken) {
        return res.status(400).json({
          error:
            "Please go to connect account before you can see social media dashboard",
        });
      }

      // convert since and until to UNIX
      const sinceUnix = Math.floor(since.getTime() / 1000);
      const untilUnix = Math.floor(until.getTime() / 1000);

      const filter = await prisma.Filter.findMany({
        where: {
          user_id: decoded.id,
          Platform: {
            name: platform === "facebook" ? "Facebook" : "Instagram",
          },
          Category: {
            name: "Mention",
          },
        },
      });
      // console.log("🚀 ~ mentionAnalytic ~ filter:", filter);

      const mentionData = await Promise.all(
        filter.map(async (pf) => {
          try {
            const endpoint =
              platform === "facebook"
                ? `https://graph.facebook.com/v19.0/${pf.id}/tagged`
                : `https://graph.facebook.com/v19.0/${pf.id}/tags`;

            let page_access_token = null;

            if (platform === "facebook") {
              const page_info = await axios.get(
                `https://graph.facebook.com/v19.0/${pf.id}`,
                {
                  params: {
                    fields: "access_token,instagram_business_account",
                    access_token: facebookAccessToken,
                  },
                }
              );
              page_access_token = page_info.data.access_token;
            }

            const response = await axios.get(endpoint, {
              params: {
                access_token:
                  platform === "facebook"
                    ? page_access_token
                    : facebookAccessToken,
                fields:
                  platform === "facebook"
                    ? "created_time,message"
                    : "timestamp,caption",
                since: sinceUnix,
                until: untilUnix,
              },
            });

            return response.data.data;
          } catch (error) {
            return [];
          }
        })
      );

      // Flatten both arrays
      let flattenedMentionData = mentionData.flat();
      // console.log(flattenedMentionData);
      // if (platform === "instagram") {
      //   const hashtagFilter = await prisma.Filter.findMany({
      //     where: {
      //       user_id: decoded.id,
      //       is_active: true,
      //       Platform: {
      //         name: "Instagram",
      //       },
      //       Category: {
      //         name: "Hashtag",
      //       },
      //     },
      //   });

      //   if (hashtagFilter.length > 0) {
      //     const hashtagData = await Promise.all(
      //       hashtagFilter.map(async (hf) => {
      //         try {
      //           const hashtagId = await axios.get(
      //             `https://graph.facebook.com/v19.0/ig_hashtag_search`,
      //             {
      //               params: {
      //                 user_id: filter[0].id,
      //                 q: hf.parameter,
      //                 access_token: facebookAccessToken,
      //               },
      //             }
      //           );

      //           const response = await axios.get(
      //             `https://graph.facebook.com/v19.0/${hashtagId.data.data[0].id}/recent_media`,
      //             {
      //               params: {
      //                 user_id: filter[0].id,
      //                 fields: "timestamp,caption",
      //                 access_token: facebookAccessToken,
      //               },
      //             }
      //           );

      //           return response.data.data;
      //         } catch (error) {
      //           console.log(error.message);
      //           return [];
      //         }
      //       })
      //     );
      //     let flattenedHashtagData = hashtagData.flat();

      //     // Add new data to the flattened array
      //     flattenedMentionData.push(...flattenedHashtagData);
      //   }
      // }

      // console.log(flattenedMentionData);
      if (platform === "instagram") {
        flattenedMentionData = flattenedMentionData.filter((post) => {
          const date = new Date(post.timestamp);
          return date >= since && date <= until;
        });
      }

      const countsByYear = flattenedMentionData.reduce((acc, post) => {
        const date = new Date(
          platform === "facebook" ? post.created_time : post.timestamp
        );
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const weekNumber = getWeekNumber(date);

        if (!acc[year]) acc[year] = {};
        if (!acc[year][month]) acc[year][month] = {};
        if (!acc[year][month][weekNumber]) acc[year][month][weekNumber] = 0;
        acc[year][month][weekNumber]++;
        return acc;
      }, {});

      return res.json({
        message: "Data has been fetched",
        statusCode: 200,
        data: countsByYear,
        post: flattenedMentionData,
      });
    }
  } catch (error) {
    res.status(400).json({
      error: "An error has occurred",
      message: error.message,
    });
  }
};

module.exports = mentionAnalytic;
