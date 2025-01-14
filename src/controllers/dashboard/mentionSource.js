const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const convertToTimestamp = require("../../utils/convertToTimestamp");

const mentionSource = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Please login first",
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

    if (platform === "news") {
      const fromDate = new Date(since);
      const toDate = new Date(until);

      const filter = await prisma.Filter.findMany({
        where: {
          user_id: decoded.id,
          Platform: {
            name: "News",
          },
          Category: {
            name: "Keyword",
          },
        },
      });
      // console.log("🚀 ~ mentionSource ~ filter:", filter);

      let allNews = [];

      if (filter.length > 0) {
        await Promise.all(
          filter.map(async (item) => {
            const news = await prisma.News.findMany({
              where: {
                title: {
                  contains: item.parameter,
                },
                published_at: {
                  lte: toDate,
                  gte: fromDate,
                },
              },
            });

            allNews = allNews.concat(news);
          })
        );
      }

      // Source count for news per keyword
      const sourceCount = allNews.reduce((acc, news) => {
        if (!acc[news.source]) {
          acc[news.source] = {
            totalPosts: 0,
          };
        }
        acc[news.source].totalPosts++;
        return acc;
      }, {});

      return res.json({
        message: "Data has been fetched",
        statusCode: 200,
        data: {
          keyword: sourceCount,
        },
        post: allNews,
      });
    } else if (platform === "facebook") {
      const facebook_access_token = req.cookies.facebook_access_token;

      if (!facebook_access_token) {
        return res.status(401).json({
          error: "Unauthorized",
          message:
            "Please go to connect account before you can see social media dashboard",
        });
      }

      const sinceUnix = convertToTimestamp(since);
      const untilUnix = convertToTimestamp(until);

      const filter = await prisma.Filter.findMany({
        where: {
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
          filter.map(async (item) => {
            const page_token = await axios.get(
              `https://graph.facebook.com/v19.0/${item.id}`,
              {
                params: {
                  fields: "name,access_token",
                  access_token: facebook_access_token,
                },
              }
            );

            const page_name = page_token.data.name;
            const page_access_token = page_token.data.access_token;

            const posts = await axios.get(
              `https://graph.facebook.com/v19.0/${item.id}/tagged`,
              {
                params: {
                  fields: `id,message,created_time`,
                  since: sinceUnix,
                  until: untilUnix,
                  access_token: page_access_token,
                },
              }
            );

            if (posts.data.data.length === 0) return [];

            posts.data.data.forEach((p) => {
              allMentions.push({
                id: p.id,
                message: p.message,
                created_time: p.created_time,
                page_name,
                page_id: item.id, // Adding page_id from filter item
              });
            });
          })
        );
      }

      // Source count for Facebook per page and add the page id in response
      const sourceCount = allMentions.reduce((acc, mention) => {
        if (!acc[mention.page_name]) {
          acc[mention.page_name] = {
            page_id: mention.page_id,
            totalPosts: 0,
          };
        }
        acc[mention.page_name].totalPosts++;
        return acc;
      }, {});

      return res.json({
        message: "Data has been fetched",
        statusCode: 200,
        data: {
          mention: sourceCount,
        },
        post: allMentions,
      });
    } else if (platform === "instagram") {
      const facebook_access_token = req.cookies.facebook_access_token;

      if (!facebook_access_token) {
        return res.status(401).json({
          error: "Unauthorized",
          message:
            "Please go to connect account before you can see social media dashboard",
        });
      }

      const mentionFilter = await prisma.Filter.findMany({
        where: {
          user_id: decoded.id,
          Platform: {
            name: "Instagram",
          },
          Category: {
            name: "Mention",
          },
        },
      });
      // console.log("🚀 ~ mentionSource ~ mentionFilter:", mentionFilter);

      let mentionPosts = [];

      if (mentionFilter.length > 0) {
        await Promise.all(
          mentionFilter.map(async (f) => {
            // console.log("first");
            const posts = await axios.get(
              `https://graph.facebook.com/v19.0/${f.id}/tags`,
              {
                params: {
                  fields: "timestamp",
                  access_token: facebook_access_token,
                },
              }
            );
            // console.log("🚀 ~ mentionFilter.map ~ posts:", posts);

            const username = f.parameter;

            posts.data.data.forEach((p) => {
              mentionPosts.push({
                id: p.id,
                username,
                filter_id: f.id,
                timestamp: p.timestamp,
              });
            });
          })
        );
      }

      const hashtagFilter = await prisma.Filter.findMany({
        where: {
          user_id: decoded.id,
          Platform: {
            name: "Instagram",
          },
          Category: {
            name: "Hashtag",
          },
        },
      });

      let hashtagPosts = [];

      if (hashtagFilter.length > 0) {
        await Promise.all(
          hashtagFilter.map(async (f) => {
            const hashtagIdResponse = await axios.get(
              `https://graph.facebook.com/v19.0/ig_hashtag_search`,
              {
                params: {
                  user_id: mentionFilter[0].id,
                  q: f.parameter,
                  access_token: facebook_access_token,
                },
              }
            );

            const hashtagId = hashtagIdResponse.data.data[0].id;
            const hashtagName = f.parameter;

            const posts = await axios.get(
              `https://graph.facebook.com/v19.0/${hashtagId}/recent_media`,
              {
                params: {
                  user_id: mentionFilter[0].id,
                  fields: "timestamp",
                  access_token: facebook_access_token,
                },
              }
            );
            // console.log("🚀 ~ hashtagFilter.map ~ posts:", posts);

            posts.data.data.forEach((p) => {
              hashtagPosts.push({
                id: p.id,
                hashtagId,
                hashtagName,
                timestamp: p.timestamp,
              });
            });
          })
        );
      }

      const mentionPostsInRange = mentionPosts.filter((post) => {
        return post.timestamp >= since && post.timestamp <= until;
      });

      // Mention source count
      const mentionSourceCount = mentionPostsInRange.reduce((acc, post) => {
        if (!acc[post.username]) {
          acc[post.username] = {
            id: post.filter_id,
            totalPosts: 0,
          };
        }
        acc[post.username].totalPosts++;
        return acc;
      }, {});
      // console.log(
      //   "🚀 ~ mentionSourceCount ~ mentionSourceCount:",
      //   mentionSourceCount
      // );

      const hashtagPostsInRange = hashtagPosts.filter((post) => {
        return post.timestamp >= since && post.timestamp <= until;
      });

      // Hashtag source count
      const hashtagSourceCount = hashtagPostsInRange.reduce((acc, post) => {
        if (!acc[post.hashtagName]) {
          acc[post.hashtagName] = {
            id: post.hashtagId,
            instagram_id: mentionFilter[0].id,
            totalPosts: 0,
          };
        }
        acc[post.hashtagName].totalPosts++;
        return acc;
      }, {});
      // console.log(
      //   "🚀 ~ hashtagSourceCount ~ hashtagSourceCount:",
      //   hashtagSourceCount
      // );

      return res.json({
        message: "Data has been fetched",
        statusCode: 200,
        data: {
          mention: mentionSourceCount,
          hashtag: hashtagSourceCount,
        },
        post: {
          mention: mentionPostsInRange,
          hashtag: hashtagPostsInRange,
        },
      });
    }
  } catch (error) {
    res.status(400).json({
      error: "An error has occurred",
      message: error.message,
    });
  }
};

module.exports = mentionSource;
