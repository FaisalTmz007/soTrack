const axios = require("axios");
const translate = require("translate-google");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const mentionDetails = async (req, res) => {
  try {
    const token = req.cookies.facebook_access_token;

    if (!token) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide a valid access token",
      });
    }

    const { platform, since, until, topic } = req.query;

    const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);

    if ((!platform || !since || !until, !topic)) {
      return res.status(400).json({
        error: "Bad Request",
        message:
          "Please provide platform, since, until and topic query parameters",
      });
    }

    if (platform === "facebook") {
      const { pageId } = req.query;
      console.log("🚀 ~ mentionDetails ~ pageId:", pageId);

      const page_info = await axios.get(
        `https://graph.facebook.com/v19.0/${pageId}`,
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
        `https://graph.facebook.com/v19.0/${pageId}/tagged`,
        {
          params: {
            fields: `id, message, created_time, permalink_url`,
            since: convertToTimestamp(since),
            until: convertToTimestamp(until),
            access_token: fb_page_token,
          },
        }
      );
      console.log("🚀 ~ mentionDetails ~ posts:", posts.data.data);
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
      console.log("🚀 ~ mentionDetails ~ updatedPost:", updatedPost);

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
        console.log("🚀 ~ mentionDetails ~ filteredPost:", filteredPost);

        return res.json({
          message: "Success",
          statusCode: 200,
          data: filteredPost,
        });
      }
    } else if (platform === "instagram") {
      const { pageId } = req.query;

      const instagramId = await axios.get(
        `https://graph.facebook.com/v19.0/${pageId}`,
        {
          params: {
            fields: "instagram_business_account",
            access_token: token,
          },
        }
      );

      if (!instagramId.data.instagram_business_account) {
        return res.status(400).json({
          error: "Bad Request",
          message: "The page does not have an Instagram account",
        });
      }

      const instagram_business_account =
        instagramId.data.instagram_business_account.id;

      const instagramTags = await axios.get(
        `https://graph.facebook.com/v19.0/${instagram_business_account}/tags`,
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

          const predict = await axios.post(`${process.env.FLASK_URL}/predict`, {
            headline: translatedcaption,
          });

          return {
            id: tag.id,
            date: tag.timestamp,
            url: tag.permalink,
            mention: caption,
            crime_type: predict.data.prediction,
          };
        })
      );
      console.log("🚀 ~ mentionDetails ~ updatedTags:", updatedTags);

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

      //   res.status(200).json(instagramTags.data.data);
    } else if (platform === "news") {
      const news = await prisma.news.findMany({
        where: {
          published_at: {
            gte: new Date(since),
            lte: new Date(until),
          },
        },
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

// Function to convert date string to Unix timestamp
const convertToTimestamp = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return Math.floor(new Date(year, month - 1, day).getTime() / 1000); // Month is 0-indexed in JavaScript Date
};

module.exports = mentionDetails;
