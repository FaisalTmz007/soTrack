const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const translate = require("translate-google");

const getSentimentPercentages = (items) => {
  const sentimentCounts = items.reduce((acc, item) => {
    acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
    return acc;
  }, {});

  const totalItems = items.length;
  return Object.entries(sentimentCounts).reduce((acc, [sentiment, count]) => {
    acc[sentiment] = ((count / totalItems) * 100).toFixed(2) + "%";
    return acc;
  }, {});
};

const processFilters = async (filters, getPosts, facebook_access_token) => {
  let allPosts = [];

  await Promise.all(
    filters.map(async (filter) => {
      try {
        const posts = await getPosts(filter, facebook_access_token);
        allPosts.push(...posts);
      } catch (error) {
        console.error(`Error processing filter ${filter.id}: `, error);
      }
    })
  );

  return allPosts;
};

const translateAndAnalyzeSentiments = async (captions, startIndex = 0) => {
  const batchSize = 10; // Adjust the batch size as needed
  const sentiments = [];

  for (let i = 0; i < captions.length; i += batchSize) {
    const batch = captions.slice(i, i + batchSize);
    const translatedCaptions = await Promise.all(
      batch.map((caption) => translate(caption, { from: "id", to: "en" }))
    );

    const response = await axios.post(`${process.env.FLASK_URL}/sentiment`, {
      headlines: translatedCaptions,
    });

    sentiments.push(...response.data.sentiments.map((s) => s.category));
  }

  return sentiments;
};

const getInstagramMentionPosts = async (
  filter,
  accessToken,
  fromUnix,
  toUnix
) => {
  const postsResponse = await axios.get(
    `https://graph.facebook.com/v19.0/${filter.id}/tags`,
    {
      params: {
        fields: `id,caption,timestamp`,
        access_token: accessToken,
        since: fromUnix,
        until: toUnix,
      },
    }
  );

  const posts = postsResponse.data.data;

  if (posts.length === 0) return [];

  const captions = posts.map((post) => post.caption || "no caption");
  const sentiments = await translateAndAnalyzeSentiments(captions);

  posts.forEach((post, index) => {
    post.sentiment = sentiments[index];
  });

  return posts;
};

const getInstagramHashtagPosts = async (filter, accessToken, userId) => {
  const hashtagIdResponse = await axios.get(
    `https://graph.facebook.com/v19.0/ig_hashtag_search`,
    {
      params: {
        user_id: userId,
        q: filter.parameter,
        access_token: accessToken,
      },
    }
  );

  const hashtagId = hashtagIdResponse.data.data[0].id;

  const postsResponse = await axios.get(
    `https://graph.facebook.com/v19.0/${hashtagId}/recent_media`,
    {
      params: {
        user_id: userId,
        fields: "id,caption,timestamp",
        access_token: accessToken,
      },
    }
  );

  const posts = postsResponse.data.data;

  if (posts.length === 0) return [];

  const captions = posts.map((post) => post.caption || "no caption");
  const sentiments = await translateAndAnalyzeSentiments(captions);

  posts.forEach((post, index) => {
    post.sentiment = sentiments[index];
  });

  return posts;
};

const sentimentAnalysis = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    const { platform, from, to } = req.query;

    if (!refreshToken) {
      return res.status(400).json({ message: "Please login first" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    if (!platform || !from || !to) {
      return res.status(400).json({
        message: "Please provide platform, from, and to query parameters",
      });
    }

    const fromUnix = Math.floor(new Date(from).getTime() / 1000);
    const toUnix = Math.floor(new Date(to).getTime() / 1000);

    let filters, getPosts;

    if (platform === "news") {
      filters = await prisma.Filter.findMany({
        where: {
          is_active: true,
          user_id: decoded.id,
          Platform: { name: "News" },
          Category: { name: "Keyword" },
        },
      });

      getPosts = async (filter) => {
        const items = await prisma.News.findMany({
          where: {
            title: { contains: filter.parameter },
            published_at: { gte: new Date(from), lte: new Date(to) },
          },
        });

        if (items.length === 0) return [];

        const captions = items.map((item) => item.title || "no caption");
        const sentiments = await translateAndAnalyzeSentiments(captions);

        items.forEach((item, index) => {
          item.sentiment = sentiments[index];
        });

        return items;
      };
    } else if (platform === "facebook") {
      const facebook_access_token = req.cookies.facebook_access_token;

      if (!facebook_access_token) {
        return res.status(400).json({ message: "Please login first" });
      }

      filters = await prisma.Filter.findMany({
        where: {
          is_active: true,
          user_id: decoded.id,
          Platform: { name: "Facebook" },
          Category: { name: "Mention" },
        },
      });

      getPosts = async (filter, accessToken) => {
        const pageTokenResponse = await axios.get(
          `https://graph.facebook.com/v19.0/${filter.id}`,
          {
            params: {
              fields: "access_token",
              access_token: accessToken,
            },
          }
        );

        const pageToken = pageTokenResponse.data.access_token;

        const postsResponse = await axios.get(
          `https://graph.facebook.com/v19.0/${filter.id}/tagged`,
          {
            params: {
              fields: "id,message,created_time,permalink_url",
              since: fromUnix,
              until: toUnix,
              access_token: pageToken,
            },
          }
        );

        const posts = postsResponse.data.data;

        if (posts.length === 0) return [];

        const captions = posts.map((post) => post.message || "no caption");
        const sentiments = await translateAndAnalyzeSentiments(captions);

        posts.forEach((post, index) => {
          post.sentiment = sentiments[index];
        });

        return posts;
      };
    } else if (platform === "instagram") {
      const facebook_access_token = req.cookies.facebook_access_token;

      if (!facebook_access_token) {
        return res.status(400).json({ message: "Please login first" });
      }

      filters = await prisma.Filter.findMany({
        where: {
          is_active: true,
          user_id: decoded.id,
          Platform: { name: "Instagram" },
          Category: { name: "Mention" },
        },
      });

      const mentionPosts = await processFilters(
        filters,
        async (filter) =>
          getInstagramMentionPosts(
            filter,
            facebook_access_token,
            fromUnix,
            toUnix
          ),
        facebook_access_token
      );

      const hashtagFilters = await prisma.Filter.findMany({
        where: {
          is_active: true,
          user_id: decoded.id,
          Platform: { name: "Instagram" },
          Category: { name: "Hashtag" },
        },
      });

      const hashtagPosts = await processFilters(
        hashtagFilters,
        async (filter) =>
          getInstagramHashtagPosts(
            filter,
            facebook_access_token,
            filters[0].id
          ),
        facebook_access_token
      );

      const allPosts = mentionPosts.concat(hashtagPosts);

      if (allPosts.length === 0) {
        return res.status(404).json({ message: "No posts found" });
      }

      const sentimentPercentages = getSentimentPercentages(allPosts);

      return res.json({ message: "All posts", data: sentimentPercentages });
    } else {
      return res.status(400).json({ message: "Invalid platform" });
    }

    const allPosts = await processFilters(
      filters,
      getPosts,
      req.cookies.facebook_access_token
    );

    if (allPosts.length === 0) {
      return res.status(404).json({ message: "No posts found" });
    }

    const sentimentPercentages = getSentimentPercentages(allPosts);

    res.json({
      message: "All posts",
      data: { sentimentPercentages, allPosts },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = sentimentAnalysis;
