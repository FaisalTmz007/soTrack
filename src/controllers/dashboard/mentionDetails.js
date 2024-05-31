const axios = require("axios");
const translate = require("translate-google");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const convertToTimestamp = require("../../utils/convertToTimestamp");

const mentionDetails = async (req, res) => {
  try {
    const { platform, source, since, until, topic } = req.query;

    const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);

    if ((!platform || !since || !until, !topic)) {
      return res.status(400).json({
        error: "Bad Request",
        message:
          "Please provide platform, since, until and topic query parameters",
      });
    }

    if (platform === "facebook") {
      const token = req.cookies.facebook_access_token;

      if (!token) {
        return res.status(400).json({
          error: "Bad Request",
          message:
            "Please go to connect account before you can see social media dashboard",
        });
      }
      const { page_id } = req.query;

      if (!page_id) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Please provide a valid page_id",
        });
      }

      const page_info = await axios.get(
        `https://graph.facebook.com/v19.0/${page_id}`,
        {
          params: {
            fields: "name, access_token",
            access_token: token,
          },
        }
      );

      const fb_page_token = page_info.data.access_token;
      //   console.log("🚀 ~ mentionDetails ~ fb_page_token:", fb_page_token);

      const posts = await axios.get(
        `https://graph.facebook.com/v19.0/${page_id}/tagged`,
        {
          params: {
            fields: `id, message, created_time, permalink_url`,
            since: convertToTimestamp(since),
            until: convertToTimestamp(until),
            access_token: fb_page_token,
          },
        }
      );
      // console.log("🚀 ~ mentionDetails ~ posts:", posts.data.data);
      const updatedPost = await Promise.all(
        posts.data.data.map(async (post) => {
          const caption = post.message ? post.message : "No caption";
          const translatedcaption = await translate(caption, { to: "en" });

          const predict = await axios.post(`${process.env.FLASK_URL}/predict`, {
            headline: translatedcaption,
          });

          return {
            id: post.id,
            date: post.created_time,
            url: post.permalink_url,
            mention: caption,
            about: predict.data.prediction,
          };
        })
      );
      // console.log("🚀 ~ mentionDetails ~ updatedPost:", updatedPost);

      if (capitalizedTopic === "All") {
        return res.json({
          message: "Success",
          statusCode: 200,
          data: updatedPost,
        });
      } else {
        const filteredPost = updatedPost.filter(
          (post) => post.about === capitalizedTopic
        );
        // console.log("🚀 ~ mentionDetails ~ filteredPost:", filteredPost);

        return res.json({
          message: "Success",
          statusCode: 200,
          data: filteredPost,
        });
      }
    } else if (platform === "instagram") {
      const token = req.cookies.facebook_access_token;

      if (!token) {
        return res.status(400).json({
          error: "Bad Request",
          message:
            "Please go to connect account before you can see social media dashboard",
        });
      }

      if (source === "mention") {
        const { instagram_id } = req.query;

        if (!instagram_id) {
          return res.status(400).json({
            error: "Bad Request",
            message: "Please provide a valid instagram_id",
          });
        }

        const instagramTags = await axios.get(
          `https://graph.facebook.com/v19.0/${instagram_id}/tags`,
          {
            params: {
              fields:
                "id, username, comments_count,like_count,caption, permalink, timestamp",
              since: convertToTimestamp(since),
              until: convertToTimestamp(until),
              access_token: token,
            },
          }
        );

        const instagramTagsinRange = instagramTags.data.data.filter((tag) => {
          const tagTimestamp = Math.floor(
            new Date(tag.timestamp).getTime() / 1000
          );
          return (
            tagTimestamp >= convertToTimestamp(since) &&
            tagTimestamp <= convertToTimestamp(until)
          );
        });

        const updatedTags = await Promise.all(
          instagramTagsinRange.map(async (tag) => {
            const caption = tag.caption ? tag.caption : "No caption";
            const translatedcaption = await translate(caption, { to: "en" });

            const predict = await axios.post(
              `${process.env.FLASK_URL}/predict`,
              {
                headline: translatedcaption,
              }
            );

            return {
              id: tag.id,
              date: tag.timestamp,
              url: tag.permalink,
              mention: caption,
              crime_type: predict.data.prediction,
            };
          })
        );
        // console.log("🚀 ~ mentionDetails ~ updatedTags:", updatedTags);

        if (capitalizedTopic === "All") {
          return res.json({
            message: "Success",
            statusCode: 200,
            data: updatedTags,
          });
        } else {
          const filteredTags = updatedTags.filter(
            (tag) => tag.crime_type === capitalizedTopic
          );
          return res.json({
            message: "Success",
            statusCode: 200,
            data: filteredTags,
          });
        }
      } else if (source === "hashtag") {
        const { page_id, instagram_id } = req.query;

        if (!page_id || !instagram_id) {
          return res.status(400).json({
            error: "Bad Request",
            message: "Please provide a valid page_id and instagram_id",
          });
        }

        const instagramHashtags = await axios.get(
          `https://graph.facebook.com/v19.0/${page_id}/recent_media`,
          {
            params: {
              fields: `id, caption, permalink, timestamp`,
              user_id: instagram_id,
              since: convertToTimestamp(since),
              until: convertToTimestamp(until),
              access_token: token,
            },
          }
        );

        const updatedHashtags = await Promise.all(
          instagramHashtags.data.data.map(async (tag) => {
            const caption = tag.caption ? tag.caption : "No caption";
            const translatedcaption = await translate(caption, { to: "en" });

            const predict = await axios.post(
              `${process.env.FLASK_URL}/predict`,
              {
                headline: translatedcaption,
              }
            );

            return {
              id: tag.id,
              date: tag.timestamp,
              url: tag.permalink,
              mention: caption,
              crime_type: predict.data.prediction,
            };
          })
        );

        // console.log("🚀 ~ mentionDetails ~ updatedHashtags:", updatedHashtags);

        if (capitalizedTopic === "All") {
          return res.json({
            message: "Success",
            statusCode: 200,
            data: updatedHashtags,
          });
        } else {
          const filteredHashtags = updatedHashtags.filter(
            (tag) => tag.crime_type === capitalizedTopic
          );
          return res.json({
            message: "Success",
            statusCode: 200,
            data: filteredHashtags,
          });
        }
      }

      //   res.status(200).json(instagramTags.data.data);
    } else if (platform === "news") {
      // console.log("🚀 ~ mentionDetails ~ source:", source);

      const whereClause = {
        published_at: {
          gte: new Date(since),
          lte: new Date(until),
        },
      };

      if (source) {
        whereClause.source = source;
      }

      const news = await prisma.news.findMany({
        where: whereClause,
      });

      const results = news.map((post) => {
        return {
          id: post.id,
          date: post.published_at,
          url: post.url,
          mention: post.headline,
          about: post.crime_type,
        };
      });
      if (capitalizedTopic === "All") {
        return res.json({
          message: "Success",
          statusCode: 200,
          data: results,
        });
      } else {
        const filteredNews = results.filter(
          (post) => post.about === capitalizedTopic
        );
        return res.json({
          message: "Success",
          statusCode: 200,
          data: filteredNews,
        });
      }
    }
  } catch (error) {
    res.status(400).json({
      error: "An error has occurred",
      message: error.message,
    });
  }
};

module.exports = mentionDetails;
