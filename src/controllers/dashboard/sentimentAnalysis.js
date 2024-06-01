const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const translate = require("translate-google");

const sentimentAnalysis = async (req, res) => {
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

            const translatedNews = await Promise.all(
              news.map(async (n) => {
                const caption = n.title || n.caption;
                const translatedCaption = await translate(caption, {
                  from: "id",
                  to: "en",
                });

                const sentiment = await axios.post(
                  `${process.env.FLASK_URL}/sentiment`,
                  {
                    headline: translatedCaption,
                  }
                );

                n.sentiment = sentiment.data.category;

                return n;
              })
            );

            allNews.push(...translatedNews);
          })
        );
      }

      if (allNews.length === 0) {
        return res.status(404).json({
          message: "No news found",
          data: {
            positive: 0,
            negative: 0,
          },
        });
      }

      // Calculate sentiment percentages
      const sentimentCounts = allNews.reduce((acc, article) => {
        acc[article.sentiment] = (acc[article.sentiment] || 0) + 1;
        return acc;
      }, {});

      const totalArticles = allNews.length;
      const sentimentPercentages = Object.entries(sentimentCounts).reduce(
        (acc, [sentiment, count]) => {
          acc[sentiment] = ((count / totalArticles) * 100).toFixed(2) + "%";
          return acc;
        },
        {}
      );

      res.json({
        message: "All news",
        data: sentimentPercentages,
      });
    } else if (platform === "facebook") {
      const facebook_access_token = req.cookies.facebook_access_token;

      if (!facebook_access_token) {
        return res.status(400).json({
          message:
            "Please go to connect account before you can see social media dashboard",
        });
      }

      // convert from adn to into UNIX
      const fromUnix = Math.floor(new Date(from).getTime() / 1000);
      const toUnix = Math.floor(new Date(to).getTime() / 1000);

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

      let allPosts = [];

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
                  since: fromUnix,
                  until: toUnix,
                  access_token: page_token,
                },
              }
            );

            const posts = posts_response.data.data;

            if (posts.length === 0) return [];

            const translatedPosts = await Promise.all(
              posts.map(async (p) => {
                const caption = p.message || "no caption";
                const translatedMessage = await translate(caption, {
                  from: "id",
                  to: "en",
                });

                // console.log(translatedMessage);

                const sentiment = await axios.post(
                  `${process.env.FLASK_URL}/sentiment`,
                  {
                    headline: translatedMessage,
                  }
                );

                p.sentiment = sentiment.data.category;

                // console.log(sentiment.data.processed_text);
                // console.log(sentiment.data.category);

                return p;
              })
            );

            allPosts.push(...translatedPosts);
          })
        );
      }

      if (allPosts.length === 0) {
        return res.status(404).json({
          message: "No posts found",
          data: {
            positive: 0,
            negative: 0,
          },
        });
      }

      // Calculate sentiment percentages
      const sentimentCounts = allPosts.reduce((acc, post) => {
        acc[post.sentiment] = (acc[post.sentiment] || 0) + 1;
        return acc;
      }, {});

      const totalPosts = allPosts.length;
      const sentimentPercentages = Object.entries(sentimentCounts).reduce(
        (acc, [sentiment, count]) => {
          acc[sentiment] = ((count / totalPosts) * 100).toFixed(2) + "%";
          return acc;
        },
        {}
      );

      res.json({
        message: "All posts",
        data: sentimentPercentages,
      });
    } else if (platform === "instagram") {
      const facebook_access_token = req.cookies.facebook_access_token;

      if (!facebook_access_token) {
        return res.status(400).json({
          message:
            "Please go to connect account before you can see social media dashboard",
        });
      }

      // convert from adn to into UNIX
      const fromUnix = Math.floor(new Date(from).getTime() / 1000);
      const toUnix = Math.floor(new Date(to).getTime() / 1000);

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

                const sentiment = await axios.post(
                  `${process.env.FLASK_URL}/sentiment`,
                  {
                    headline: translatedCaption,
                  }
                );

                post.sentiment = sentiment.data.category;

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

                const sentiment = await axios.post(
                  `${process.env.FLASK_URL}/sentiment`,
                  {
                    headline: translatedCaption,
                  }
                );

                p.sentiment = sentiment.data.category;

                return p;
              })
            );

            allPosts.push(...translatedPosts);
          })
        );
      }

      if (allPosts.length === 0) {
        return res.status(404).json({
          message: "No posts found",
          data: {
            positive: 0,
            negative: 0,
          },
        });
      }

      const allPostsInRange = allPosts.filter((post) => {
        const timestamp = post.timestamp;
        return timestamp >= fromUnix && timestamp <= toUnix;
      });

      // Calculate sentiment percentages
      const sentimentCounts = allPostsInRange.reduce((acc, post) => {
        acc[post.sentiment] = (acc[post.sentiment] || 0) + 1;
        return acc;
      }, {});

      const totalPosts = allPosts.length;
      const sentimentPercentages = Object.entries(sentimentCounts).reduce(
        (acc, [sentiment, count]) => {
          acc[sentiment] = ((count / totalPosts) * 100).toFixed(2) + "%";
          return acc;
        },
        {}
      );

      res.json({
        message: "All posts",
        data: sentimentPercentages,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = sentimentAnalysis;
