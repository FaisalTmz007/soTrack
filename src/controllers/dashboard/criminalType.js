const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const translate = require("translate-google");
const axios = require("axios");
const convertToTimestamp = require("../../utils/convertToTimestamp");
const { post } = require("../../app");

const criminalType = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    const { platform, from, to } = req.query;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Please login first",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    if (!platform || !from || !to) {
      return res.status(400).json({
        message: "Please provide platform, from, and to query parameters",
      });
    }

    if (platform === "news") {
      const filter = await prisma.Filter.findMany({
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
                  gte: new Date(from),
                  lte: new Date(to),
                },
              },
            });

            if (news.length === 0) return [];

            news.forEach((n) => {
              allNews.push(n);
            });
          })
        );
      }

      const countsByType = allNews.reduce((acc, post) => {
        if (!acc[post.crime_type]) {
          acc[post.crime_type] = 0;
        }
        acc[post.crime_type]++;
        return acc;
      }, {});

      res.json({
        message: "Success",
        statusCode: 200,
        data: countsByType,
        post: allNews,
      });
    } else if (platform === "facebook") {
      const facebook_access_token = req.cookies.facebook_access_token;

      if (!facebook_access_token) {
        return res.status(400).json({
          message:
            "Please go to connect account before you can see social media dashboard",
        });
      }

      // convert from and to to unix timestamp
      const sinceUnix = convertToTimestamp(from);
      const untilUnix = convertToTimestamp(to);

      const filter = await prisma.Filter.findMany({
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

      let allMentions = [];

      if (filter.length > 0) {
        await Promise.all(
          filter.map(async (f) => {
            const page_token_response = await axios.get(
              `https://graph.facebook.com/v19.0/${f.id}`,
              {
                params: {
                  fields: "access_token",
                  access_token: facebook_access_token,
                },
              }
            );

            const page_token = page_token_response.data.access_token;

            const posts_response = await axios.get(
              `https://graph.facebook.com/v19.0/${f.id}/tagged`,
              {
                params: {
                  fields: `id, message, created_time, permalink_url`,
                  since: sinceUnix,
                  until: untilUnix,
                  access_token: page_token,
                },
              }
            );

            const posts = posts_response.data.data;

            if (posts.length === 0) return [];

            const translatedPosts = await Promise.all(
              posts.map(async (p) => {
                const caption = p.message || "no caption";
                const translatedCaption = await translate(caption, {
                  from: "id",
                  to: "en",
                });

                const predict = await axios.post(
                  `${process.env.FLASK_URL}/predict`,
                  {
                    headline: translatedCaption,
                  }
                );

                p.crime_type = predict.data.prediction;

                return p;
              })
            );

            allMentions.push(...translatedPosts);
          })
        );
      }

      const countsByType = allMentions.reduce((acc, post) => {
        if (!acc[post.crime_type]) {
          acc[post.crime_type] = 0;
        }
        acc[post.crime_type]++;
        return acc;
      }, {});

      res.json({
        message: "Success",
        statusCode: 200,
        data: countsByType,
        post: allMentions,
      });
    } else if (platform === "instagram") {
      const facebook_access_token = req.cookies.facebook_access_token;

      if (!facebook_access_token) {
        return res.status(400).json({
          message:
            "Please go to connect account before you can see social media dashboard",
        });
      }

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

            if (posts.data.data.length === 0) return [];

            const translatedPosts = await Promise.all(
              posts.data.data.map(async (p) => {
                const caption = p.caption || "no caption";
                const translatedCaption = await translate(caption, {
                  from: "id",
                  to: "en",
                });

                const predict = await axios.post(
                  `${process.env.FLASK_URL}/predict`,
                  {
                    headline: translatedCaption,
                  }
                );

                p.crime_type = predict.data.prediction;

                return p;
              })
            );

            allPosts.push(...translatedPosts);
          })
        );
      }

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

            const translatedPosts = await Promise.all(
              posts.data.data.map(async (p) => {
                const caption = p.caption || "no caption";
                const translatedCaption = await translate(caption, {
                  from: "id",
                  to: "en",
                });

                const predict = await axios.post(
                  `${process.env.FLASK_URL}/predict`,
                  {
                    headline: translatedCaption,
                  }
                );

                p.crime_type = predict.data.prediction;

                return p;
              })
            );

            allPosts.push(...translatedPosts);
          })
        );
      }

      const allPostsInRange = allPosts.filter((post) => {
        const postTimestamp = new Date(post.timestamp);
        const sinceDate = new Date(from);
        const untilDate = new Date(to);
        return postTimestamp >= sinceDate && postTimestamp <= untilDate;
      });

      const countsByType = allPostsInRange.reduce((acc, post) => {
        if (!acc[post.crime_type]) {
          acc[post.crime_type] = 0;
        }
        acc[post.crime_type]++;
        return acc;
      }, {});

      res.json({
        message: "Success",
        statusCode: 200,
        data: countsByType,
        post: allPostsInRange,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = criminalType;
