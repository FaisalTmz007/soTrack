const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const translate = require("translate-google");
const axios = require("axios");

// YANG INI PERLU DI UBAH

const getTimeline = async (req, res) => {
  try {
    const { platform } = req.query;

    if (platform.toLowerCase() === "instagram") {
      const token = req.cookies.facebook_access_token;

      if (!token) {
        return res.status(400).json({
          error: "Unauthorized",
          message:
            "Please go to connect account before you can see social media dashboard",
        });
      }

      const { pageId } = req.query;

      const { hashtag } = req.query ? req.query : null;
      const { mention } = req.query ? req.query : null;

      if (!hashtag && !mention) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Please provide hashtag or mention query parameters",
        });
      }

      if (hashtag) {
        const { order } = req.query;
        // separate the hashtag by comma
        const hashtags = hashtag.split(",");
        // console.log("🚀 ~ getTimeline ~ pageId:", pageId);

        const instagramId = await axios.get(
          `https://graph.facebook.com/v19.0/${pageId}`,
          {
            params: {
              fields: "instagram_business_account",
              access_token: token,
            },
          }
        );
        // console.log("🚀 ~ getTimeline ~ instagramId:", instagramId.data);

        if (!instagramId.data.instagram_business_account) {
          return res.status(400).json({
            error: "Unauthorized",
            message: `Connect your Instagram account with this facebook page first: ${facebook_page_name}`,
          });
        }

        const instagramBusinessId =
          instagramId.data.instagram_business_account.id;

        let endpoint;
        if (order === "mostpopular") {
          endpoint = "top_media";
        } else if (order === "newest") {
          endpoint = "recent_media";
        } else {
          return res.status(400).json({
            error: "Bad Request",
            message: "Invalid order parameter",
          });
        }

        const postPromises = hashtags.map(async (tag) => {
          const hashtagIdResponse = await axios.get(
            `https://graph.facebook.com/v19.0/ig_hashtag_search`,
            {
              params: {
                user_id: instagramBusinessId,
                q: tag,
                access_token: token,
              },
            }
          );

          const hashtagId = hashtagIdResponse.data.data[0]?.id; // Access the id property correctly

          if (!hashtagId) {
            console.error("Failed to get hashtag ID for tag:", tag);
            return []; // Return an empty array if the hashtagId is not found
          }

          const getPost = await axios.get(
            `https://graph.facebook.com/v19.0/${hashtagId}/${endpoint}`,
            {
              params: {
                user_id: instagramBusinessId,
                fields:
                  "id,media_url,caption,timestamp,permalink,like_count,comments_count",
                access_token: token,
              },
            }
          );

          return getPost.data.data;
        });

        const allPosts = await Promise.all(postPromises);

        const predictType = {
          posts: await Promise.all(
            allPosts.flatMap(
              async (posts) =>
                await Promise.all(
                  posts.map(async (post) => {
                    const {
                      id,
                      caption,
                      timestamp,
                      permalink,
                      like_count,
                      comments_count,
                    } = post;

                    const captionValue = caption ? caption : "No caption";

                    return {
                      id,
                      caption: captionValue,
                      timestamp,
                      permalink,
                      like_count,
                      comments_count,
                    };
                  })
                )
            )
          ),
        };

        const result = predictType.posts[0];

        return res.json({
          message: "Success",
          statusCode: 200,
          data: result,
        });
      } else if (mention) {
        // console.log(mention);
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
              access_token: token,
            },
          }
        );

        const posts = instagramTags.data.data;

        const updatedPost = await Promise.all(
          posts.map(async (post) => {
            const caption = post.caption ? post.caption : "No caption";

            return {
              id: post.id,
              caption: caption,
              timestamp: post.timestamp,
              permalink: post.permalink,
              like_count: post.like_count,
              comments_count: post.comments_count,
            };
          })
        );

        return res.json({
          message: "Success",
          statusCode: 200,
          data: updatedPost,
        });
      }
    } else if (platform.toLowerCase() === "facebook") {
      const token = req.cookies.facebook_access_token;

      if (!token) {
        return res.status(400).json({
          error: "Unauthorized",
          message:
            "Please go to connect account before you can see social media dashboard",
        });
      }

      const { pageId } = req.query;

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

      const taggedPost = await axios.get(
        `https://graph.facebook.com/v19.0/${pageId}/tagged`,
        {
          params: {
            fields: `id, message, tagged_time, permalink_url`,
            access_token: fb_page_token,
          },
        }
      );

      const posts = taggedPost.data.data;
      // console.log("🚀 ~ getTimeline ~ posts:", posts);

      const updatedPost = await Promise.all(
        posts.map(async (post) => {
          const caption = post.message ? post.message : "No caption";

          return {
            id: post.id,
            timestamp: post.tagged_time,
            caption: caption,
            permalink: post.permalink_url,
          };
        })
      );

      return res.json({
        message: "Success",
        statusCode: 200,
        data: updatedPost,
      });
    } else if (platform.toLowerCase() === "news") {
      const { keyword } = req.query;

      if (!keyword) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Please provide keyword query parameter",
        });
      }

      // split query by comma
      const keywords = keyword.split(",");

      // console.log("🚀 ~ getTimeline ~ keywords:", keywords);

      let allNews = [];

      await Promise.all(
        keywords.map(async (keyword) => {
          const news = await prisma.news.findMany({
            where: {
              title: {
                contains: keyword,
              },
            },
          });

          const updateNews = await Promise.all(
            news.map(async (post) => {
              return {
                id: post.id,
                source: post.source,
                timestamp: post.createdAt,
                caption: post.title,
                permalink: post.url,
              };
            })
          );

          allNews.push(...updateNews);
          // return updateNews;
        })
      );
      res.json({
        message: "Success",
        statusCode: 200,
        data: allNews,
      });
    }

    // res.json({ message: hashtags });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

module.exports = getTimeline;
