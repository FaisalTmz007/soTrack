const axios = require("axios");
const translate = require("translate-google");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const mostDiscussed = async (req, res) => {
  try {
    const token = req.user.accessToken;
    const { platform, pageId, since, until } = req.query;

    if (!pageId || !since || !until) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide pageId, since and until query parameters",
      });
    }

    if (platform.toLowerCase() === "instagram") {
      const page_info = await axios.get(
        `https://graph.facebook.com/v19.0/${pageId}`,
        {
          params: {
            fields: "name, access_token",
            access_token: token,
          },
        }
      );

      const instagramId = await axios.get(
        `https://graph.facebook.com/v19.0/${pageId}`,
        {
          params: {
            fields: "instagram_business_account",
            access_token: token,
          },
        }
      );

      facebook_page_name = page_info.data.name;

      if (!instagramId.data.instagram_business_account) {
        return res.status(400).json({
          error: "Unauthorized",
          message: `Connect your Instagram account with this facebook page first: ${facebook_page_name}`,
        });
      }

      const instagramBusinessId =
        instagramId.data.instagram_business_account.id;

      const instagramTags = await axios.get(
        `https://graph.facebook.com/v19.0/${instagramBusinessId}/tags`,
        {
          params: {
            fields: `id,username,comments_count,like_count,caption,timestamp`,
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

      const updatedInstagramTagsinRange = await Promise.all(
        instagramTagsinRange.map(async (tag) => {
          const translatedcaption = await translate(tag.caption, {
            from: "id",
            to: "en",
          });

          const predict = await axios.post(`${process.env.FLASK_URL}/predict`, {
            headline: translatedcaption,
          });

          // Add crime_type property to tag object
          return {
            ...tag,
            crime_type: predict.data.prediction,
          };
        })
      );

      const countsByType = updatedInstagramTagsinRange.reduce((acc, tag) => {
        const crimeType = tag.crime_type;
        if (!acc[crimeType]) acc[crimeType] = 0;
        acc[crimeType]++;
        return acc;
      }, {});

      return res.status(200).json({
        message: "Success",
        data: countsByType,
      });
    } else if (platform.toLowerCase() === "facebook") {
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

      const facebookTags = await axios.get(
        `https://graph.facebook.com/v19.0/${pageId}/tagged`,
        {
          params: {
            fields: `id,message,tagged_time`,
            access_token: fb_page_token,
          },
        }
      );

      const facebookTagsinRange = facebookTags.data.data.filter((tag) => {
        const tagTimestamp = Math.floor(
          new Date(tag.tagged_time).getTime() / 1000
        );
        return (
          tagTimestamp >= convertToTimestamp(since) &&
          tagTimestamp <= convertToTimestamp(until)
        );
      });

      const updatedFacebookTagsinRange = await Promise.all(
        facebookTagsinRange.map(async (tag) => {
          const translatedcaption = await translate(tag.message, {
            from: "id",
            to: "en",
          });

          const predict = await axios.post(`${process.env.FLASK_URL}/predict`, {
            headline: translatedcaption,
          });

          // Add crime_type property to tag object
          return {
            ...tag,
            crime_type: predict.data.prediction,
          };
        })
      );

      const countsByType = updatedFacebookTagsinRange.reduce((acc, tag) => {
        const crimeType = tag.crime_type;
        if (!acc[crimeType]) acc[crimeType] = 0;
        acc[crimeType]++;
        return acc;
      }, {});

      return res.status(200).json({
        message: "Success",
        data: countsByType,
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

// Function to convert date string to Unix timestamp
const convertToTimestamp = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return Math.floor(new Date(year, month - 1, day).getTime() / 1000); // Month is 0-indexed in JavaScript Date
};

module.exports = mostDiscussed;
