const axios = require("axios");
const translate = require("translate-google");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const convertToTimestamp = require("../../utils/convertToTimestamp");

const mostDiscussed = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Please login first",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const { platform, since, until } = req.query;

    if (!platform || !since || !until) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide platform, since and until query parameters",
      });
    }

    if (platform.toLowerCase() === "instagram") {
      const facebook_access_token = req.cookies.facebook_access_token;

      if (!facebook_access_token) {
        return res.status(400).json({
          error: "Unauthorized",
          message:
            "Please go to connect account before you can see social media dashboard",
        });
      }

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

      let allPosts = [];

      if (mentionFilter.length > 0) {
        await Promise.all(
          mentionFilter.map(async (item) => {
            const posts = await axios.get(
              `https://graph.facebook.com/v19.0/${item.id}/tags`,
              {
                params: {
                  fields: `id,caption,timestamp`,
                  access_token: facebook_access_token,
                },
              }
            );

            if (posts.data.data.length === 0) return [];

            const translatedPosts = await Promise.all(
              posts.data.data.map(async (post) => {
                const caption = post.caption || "no caption";
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

                post.crime_type = predict.data.prediction;

                return post;
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
                  limit: 50,
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
      // console.log(allPosts.length);
      const allPostsInRange = allPosts.filter((post) => {
        const postTimestamp = new Date(post.timestamp);
        const sinceDate = new Date(since);
        const untilDate = new Date(until);
        return postTimestamp >= sinceDate && postTimestamp <= untilDate;
      });

      // console.log(allPostsInRange.length);

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
    } else if (platform.toLowerCase() === "facebook") {
      const facebook_access_token = req.cookies.facebook_access_token;

      if (!facebook_access_token) {
        return res.status(400).json({
          error: "Unauthorized",
          message:
            "Please go to connect account before you can see social media dashboard",
        });
      }

      // convert since and until into UNIX
      const sinceUnix = convertToTimestamp(since);
      const untilUnix = convertToTimestamp(until);

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
    } else if (platform.toLowerCase() === "news") {
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
                  gte: new Date(since),
                  lte: new Date(until),
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
    } else {
      return res.status(400).json({
        error: "Bad Request",
        message: "Invalid platform. Please provide valid platform",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

module.exports = mostDiscussed;
