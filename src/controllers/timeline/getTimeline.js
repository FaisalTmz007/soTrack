const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");

const getTimeline = async (req, res) => {
  try {
    const { platform, hashtag, order } = req.query;
    console.log(
      "🚀 ~ getTimeline ~ platfom, hashtag, order:",
      platform,
      hashtag,
      order
    );
    const token = req.cookies.facebook_access_token;
    console.log("🚀 ~ getTimeline ~ token:", token);

    // separate the hashtag by comma
    const hashtags = hashtag.split(",");

    if (platform.toLowerCase() === "instagram") {
      const { pageId } = req.query;
      console.log("🚀 ~ getTimeline ~ pageId:", pageId);

      const instagramId = await axios.get(
        `https://graph.facebook.com/v19.0/${pageId}`,
        {
          params: {
            fields: "instagram_business_account",
            access_token: token,
          },
        }
      );
      console.log("🚀 ~ getTimeline ~ instagramId:", instagramId.data);

      if (!instagramId.data.instagram_business_account) {
        return res.status(400).json({
          error: "Unauthorized",
          message: `Connect your Instagram account with this facebook page first: ${facebook_page_name}`,
        });
      }

      const instagramBusinessId =
        instagramId.data.instagram_business_account.id;

      if (order === "mostpopular") {
        hashtags.forEach(async (tag) => {
          const hashtagId = await axios.get(
            `https://graph.facebook.com/v19.0/ig_hashtag_search?user_id=${instagramBusinessId}&q=${tag}&access_token=${token}`
          );

          const getPost = await axios.get(
            `https://graph.facebook.com/v19.0/${hashtagId.data.id}/top_media`,
            {
              params: {
                user_id: instagramBusinessId,
                fields:
                  "id,media_type,media_url,caption,timestamp,permalink,like_count,comments_count",
                access_token: token,
              },
            }
          );
        });
      } else if (order === "newest") {
      }
    } else if (platform.toLowerCase() === "facebook") {
    } else if (platform.toLowerCase() === "news") {
    }

    res.json({ message: hashtags });
  } catch (error) {}
};

module.exports = getTimeline;
