const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const socialMediaMention = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    const facebookAccessToken = req.cookies.facebook_access_token;

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    console.log("🚀 ~ socialMediaMention ~ decoded:", decoded);

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
        statusCode: 200,
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
                fields: "access_token,instagram_business_account",
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

          const result = {
            pageMention: pageMentionData.data,
          };

          if (pageData.instagram_business_account) {
            const { data: instagramData } = await axios.get(
              `https://graph.facebook.com/v19.0/${pageData.instagram_business_account.id}/tags`,
              {
                params: {
                  access_token: facebookAccessToken,
                },
              }
            );
            result.instagram = instagramData.data;
          }

          return result;
        } catch (error) {
          console.error("Error fetching data:", error);
          return {
            pageMention: [],
            instagram: [],
            error: error.message,
          };
        }
      })
    );

    const aggregatedCounts = mentionPost.reduce(
      (acc, item) => {
        acc.pageMention += item.pageMention.length;
        if (item.instagram) {
          acc.instagram += item.instagram.length;
        }
        return acc;
      },
      { pageMention: 0, instagram: 0 }
    );

    console.log(aggregatedCounts);

    res.json({
      message: "Data has been retrieved successfully",
      statusCode: 200,
      data: {
        socialMedia: aggregatedCounts.pageMention + aggregatedCounts.instagram,
      },
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = socialMediaMention;
