const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const translate = require("translate-google");
const axios = require("axios");

const criminalType = async (req, res) => {
  const { from, to } = req.query;

  try {
    const news = await prisma.News.findMany({
      where: {
        published_at: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
    });

    let posts = [];
    let instagramTags = [];

    if (req.query.pageId) {
      const { pageId } = req.query;
      const token = req.cookies.facebook_access_token;
      const page_info = await axios.get(
        `https://graph.facebook.com/v19.0/${pageId}`,
        {
          params: {
            fields: "name, instagram_business_account, access_token",
            access_token: token,
          },
        }
      );

      const fb_page_token = page_info.data.access_token;

      const postsResponse = await axios.get(
        `https://graph.facebook.com/v19.0/${pageId}/tagged`,
        {
          params: {
            fields: `id, message, created_time, permalink_url`,
            since: convertToTimestamp(from),
            until: convertToTimestamp(to),
            access_token: fb_page_token,
          },
        }
      );

      posts = postsResponse.data.data;

      await Promise.all(
        posts.map(async (post) => {
          const caption = post.message ? post.message : "No caption";
          const translatedCaption = await translate(caption, {
            from: "auto",
            to: "en",
          });

          const predict = await axios.post(`${process.env.FLASK_URL}/predict`, {
            headline: translatedCaption,
          });

          post.crime_type = predict.data.prediction; // Extract prediction directly
        })
      );

      const instagram_business_account =
        page_info.data.instagram_business_account.id;

      const instagramTagsResponse = await axios.get(
        `https://graph.facebook.com/v19.0/${instagram_business_account}/tags`,
        {
          params: {
            fields:
              "id, username, comments_count,like_count,caption, permalink, timestamp",
            since: convertToTimestamp(from),
            until: convertToTimestamp(to),
            access_token: token,
          },
        }
      );

      instagramTags = instagramTagsResponse.data.data;

      await Promise.all(
        instagramTags.map(async (tag) => {
          const caption = tag.caption ? tag.caption : "No caption";
          const translatedCaption = await translate(caption, {
            from: "auto",
            to: "en",
          });

          const predict = await axios.post(`${process.env.FLASK_URL}/predict`, {
            headline: translatedCaption,
          });

          tag.crime_type = predict.data.prediction; // Extract prediction directly
        })
      );
    }

    const mergeData = {
      news: news.map((post) => ({
        crime_type: post.crime_type,
      })),
      posts: posts.map((post) => ({
        crime_type: post.crime_type,
      })),
      instagramTags: instagramTags.map((post) => ({
        crime_type: post.crime_type,
      })),
    };

    const newsCrimeTypes = mergeData.news.map((post) => post.crime_type);
    const postsCrimeTypes = mergeData.posts.map((post) => post.crime_type);
    const instagramTagsCrimeTypes = mergeData.instagramTags.map(
      (post) => post.crime_type
    );

    const allCrimeTypes = [
      ...newsCrimeTypes,
      ...postsCrimeTypes,
      ...instagramTagsCrimeTypes,
    ];

    const countsByType = allCrimeTypes.reduce((acc, crimeType) => {
      if (!acc[crimeType]) acc[crimeType] = 0;
      acc[crimeType]++;
      return acc;
    }, {});

    res.json(countsByType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const convertToTimestamp = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return Math.floor(new Date(year, month - 1, day).getTime() / 1000); // Month is 0-indexed in JavaScript Date
};

module.exports = criminalType;
