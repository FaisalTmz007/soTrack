const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const getWeekNumber = require("../../utils/getWeekNumber");

const socialMediaMention = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    const facebookAccessToken = req.cookies.facebook_access_token;
    const { platform } = req.query;
    console.log(platform);

    if (!refreshToken) {
      return res.status(401).json({
        error: "Unauthorized",
        message:
          "Please go to connect account before you can see social media dashboard",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    if (platform === "facebook") {
      const mentionFacebook = await prisma.Filter.findMany({
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

      if (mentionFacebook.length === 0) {
        return res.json({
          message: "No filters found",
          statusCode: 400,
          data: "No social media mention found",
        });
      }

      const mentionPost = await Promise.all(
        mentionFacebook.map(async (mf) => {
          try {
            const { data: pageData } = await axios.get(
              `https://graph.facebook.com/v19.0/${mf.id}`,
              {
                params: {
                  fields: "access_token",
                  access_token: facebookAccessToken,
                },
              }
            );

            const { data: pageMentionData } = await axios.get(
              `https://graph.facebook.com/v19.0/${mf.id}/tagged`,
              {
                params: {
                  fields: "message,from,created_time",
                  access_token: pageData.access_token,
                },
              }
            );

            // change created_time to timestamp
            const pageMention = pageMentionData.data.map((mention) => {
              return {
                timestamp: mention.created_time,
              };
            });

            const posts = [...pageMention];

            return posts.length > 0 ? { posts } : null;
          } catch (error) {
            console.error("Error fetching data:", error);
            return null;
          }
        })
      );

      // Filter out null entries
      const filteredMentions = mentionPost.filter(
        (mention) => mention !== null
      );

      const countsByYear = filteredMentions[0].posts.reduce((acc, post) => {
        const date = new Date(post.timestamp);
        const year = date.getFullYear();
        const month = date.getMonth();
        const week = getWeekNumber(date);

        if (!acc[year]) {
          acc[year] = {};
        }
        if (!acc[year][month]) {
          acc[year][month] = {};
        }
        if (!acc[year][month][week]) acc[year][month][week] = 0;
        acc[year][month][week]++;
        return acc;
      }, {});

      res.json({
        message: "Data has been retrieved successfully",
        statusCode: 200,
        data: {
          total: filteredMentions[0].posts.length,
          posts: countsByYear,
        },
      });
    } else if (platform === "instagram") {
      const filter = await prisma.Filter.findMany({
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

      let allPosts = [];

      if (filter.length > 0) {
        await Promise.all(
          filter.map(async (f) => {
            const { data: posts } = await axios.get(
              `https://graph.facebook.com/v19.0/${f.id}/tags`,
              {
                params: {
                  fields: "id,timestamp",
                  access_token: facebookAccessToken,
                },
              }
            );

            allPosts = [...allPosts, ...posts.data];
          })
        );
      }

      const countsByYear = allPosts.reduce((acc, post) => {
        const date = new Date(post.timestamp);
        const year = date.getFullYear();
        const month = date.getMonth();
        const week = getWeekNumber(date);

        if (!acc[year]) {
          acc[year] = {};
        }
        if (!acc[year][month]) {
          acc[year][month] = {};
        }
        if (!acc[year][month][week]) acc[year][month][week] = 0;
        acc[year][month][week]++;
        return acc;
      }, {});

      res.json({
        message: "Data has been retrieved successfully",
        statusCode: 200,
        data: {
          total: allPosts.length,
          posts: countsByYear,
        },
      });
    } else {
      res.status(400).json({
        error: "An error has occurred",
        message: "Invalid platform",
      });
    }

    // console.log("🚀 ~ socialMediaMention ~ decoded:", decoded);
  } catch (error) {
    res.status(400).json({
      error: "An error has occurred",
      message: error.message,
    });
  }
};

module.exports = socialMediaMention;
