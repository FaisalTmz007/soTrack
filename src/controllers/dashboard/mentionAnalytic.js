const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");
const jwt = require("jsonwebtoken");

const mentionAnalytic = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken)
      return res.status(400).json({
        error: "Please login first",
      });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const { platform } = req.query;

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

      if (keywordNews.length === 0) {
        return res.status(400).json({
          messsage:
            "No keyword is been activated, Please activate keyword first",
          statusCode: 400,
        });
      }
      const newsMention = await Promise.all(
        keywordNews.map(async (mf) => {
          try {
            const news = await prisma.News.findMany({
              where: {
                title: {
                  contains: mf.keyword,
                },
              },
            });
            return news;
          } catch (error) {
            return [];
          }
        })
      );

      // Flatten the newsMention array
      const flattenedNewsMention = newsMention.flat();

      const countsByYear = flattenedNewsMention.reduce((acc, post) => {
        const date = new Date(post.published_at);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const weekNumber = getWeekNumber(date);

        if (!acc[year]) acc[year] = {};
        if (!acc[year][month]) acc[year][month] = {};
        if (!acc[year][month][weekNumber]) acc[year][month][weekNumber] = 0;
        acc[year][month][weekNumber]++;
        return acc;
      }, {});

      return res.status(200).json({
        message: "Data has been retrieved successfully",
        statusCode: 200,
        data: {
          news: countsByYear,
        },
      });
    } else if (platform === "facebook" || platform === "instagram") {
      const facebookAccessToken = req.cookies.facebook_access_token;

      if (!facebookAccessToken) {
        return res.status(400).json({
          error: "Please login to Facebook first",
        });
      }

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
      console.log("🚀 ~ mentionAnalytic ~ filter:", filter);

      const mentionData = await Promise.all(
        filter.map(async (pf) => {
          try {
            const endpoint =
              platform === "facebook"
                ? `https://graph.facebook.com/v19.0/${pf.id}/tagged`
                : `https://graph.facebook.com/v19.0/${pf.id}/tags`;

            const page_info = await axios.get(
              `https://graph.facebook.com/v19.0/${pf.id}`,
              {
                params: {
                  fields: "access_token,instagram_business_account",
                  access_token: facebookAccessToken,
                },
              }
            );

            const response = await axios.get(endpoint, {
              params: {
                access_token:
                  platform === "facebook"
                    ? page_info.data.access_token
                    : facebookAccessToken,
                fields: platform === "facebook" ? "created_time" : "timestamp",
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

      if (platform === "instagram") {
        const hashtagFilter = await prisma.Filter.findMany({
          where: {
            user_id: decoded.id,
            is_active: true,
            Platform: {
              name: "Instagram",
            },
            Category: {
              name: "Hashtag",
            },
          },
        });

        if (hashtagFilter.length > 0) {
          const hashtagData = await Promise.all(
            hashtagFilter.map(async (hf) => {
              try {
                const hashtagId = await axios.get(
                  `https://graph.facebook.com/v19.0/ig_hashtag_search`,
                  {
                    params: {
                      user_id: filter[0].id,
                      q: hf.parameter,
                      access_token: facebookAccessToken,
                    },
                  }
                );

                const response = await axios.get(
                  `https://graph.facebook.com/v19.0/${hashtagId.data.data[0].id}/recent_media`,
                  {
                    params: {
                      user_id: filter[0].id,
                      fields: "timestamp",
                      access_token: facebookAccessToken,
                    },
                  }
                );

                // console.log(response.data.data);

                // response.data.data.forEach((media) => {
                //   console.log(media.timestamp);
                //   mentionData.push(media.timestamp);
                // });
                return response.data.data;
              } catch (error) {
                console.log(error.message);
                return [];
              }
            })
          );
          let flattenedHashtagData = hashtagData.flat();

          // Add new data to the flattened array
          flattenedMentionData.push(...flattenedHashtagData);
        }
      }

      console.log(flattenedMentionData);

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
      });
    }
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
