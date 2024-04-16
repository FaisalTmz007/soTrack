const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const mentionSource = async (req, res) => {
  try {
    const token = req.user.accessToken;

    const { pageId, since, until } = req.query;

    if (!pageId || !since || !until) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide pageId, since and until query parameters",
      });
    }

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

    const instagramBusinessId = instagramId.data.instagram_business_account.id;

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
      const tagTimestamp = Math.floor(new Date(tag.timestamp).getTime() / 1000);
      return (
        tagTimestamp >= convertToTimestamp(since) &&
        tagTimestamp <= convertToTimestamp(until)
      );
    });
    // console.log(
    //   "🚀 ~ instagramTagsinRange ~ instagramTagsinRange:",
    //   instagramTagsinRange
    // );

    // console.log("ig :", instagramTagsinRange.length);

    const fb_page_token = page_info.data.access_token;
    // console.log("🚀 ~ countInstagramTag ~ token:", token);
    // console.log("🚀 ~ countInstagramTag ~ fb_page_token:", fb_page_token);

    const fbTags = await axios.get(
      `https://graph.facebook.com/v19.0/${pageId}/tagged`,
      {
        params: {
          fields: `id,message,tagged_time`,
          access_token: fb_page_token,
        },
      }
    );

    const facebookTagsinRange = fbTags.data.data.filter((tag) => {
      const tagTimestamp = Math.floor(
        new Date(tag.tagged_time).getTime() / 1000
      );
      return (
        tagTimestamp >= convertToTimestamp(since) &&
        tagTimestamp <= convertToTimestamp(until)
      );
    });

    const fromDate = new Date(since);
    const toDate = new Date(until);

    const news = await prisma.News.findMany({
      where: {
        published_at: {
          lte: toDate,
          gte: fromDate,
        },
      },
    });

    // Count occurrences of each unique source
    const sourceCount = {};
    news.forEach((item) => {
      const { source } = item;
      if (sourceCount[source]) {
        sourceCount[source]++;
      } else {
        sourceCount[source] = 1;
      }
    });

    // console.log("🚀 ~ countInstagramTag ~ sourceCount:", sourceCount);

    // console.log("fb :", facebookTagsinRange.length);

    const dataLength = {
      instagram: instagramTagsinRange.length,
      facebook: facebookTagsinRange.length,
      ...sourceCount,
    };

    const results = Object.entries(dataLength)
      .filter(([platform, count]) => count > 0)
      .map(([platform, count]) => `${platform}: ${count}`);

    return res.json({
      message: "Data has been fetched",
      statusCode: 200,
      data: results,
    });
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

module.exports = mentionSource;
