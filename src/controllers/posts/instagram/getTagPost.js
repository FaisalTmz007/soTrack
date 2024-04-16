const axios = require("axios");
const jwt = require("jsonwebtoken");
const translate = require("translate-google");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getTagPost = async (req, res) => {
  try {
    const token = req.user.accessToken;
    const refresh_token = req.cookies.refresh_token;

    // console.log(refresh_token);
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

    const user = await prisma.User.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!user.facebook_id) {
      return res.status(400).json({
        error: "Unauthorized",
        message: "Unauthorized",
      });
    }
    const fb_id = user.facebook_id;
    // console.log(user);

    const response = await axios.get(
      `https://graph.facebook.com/v19.0/${fb_id}/accounts`,
      {
        params: {
          fields: "instagram_business_account",
          access_token: token,
        },
      }
    );

    let ig_id;
    response.data.data.forEach((item) => {
      if (item.instagram_business_account) {
        ig_id = item.instagram_business_account.id;
      }
    });

    console.log(ig_id);

    if (!ig_id) {
      return res.status(400).json({
        error: "Unauthorized",
        message: "Unauthorized",
      });
    }

    const user_tags = await axios.get(
      `https://graph.facebook.com/v19.0/${ig_id}/tags`,
      {
        params: {
          fields:
            "id,username,media_url,timestamp,comments_count,like_count,caption,permalink",
          access_token: token,
        },
      }
    );

    const igPlatform = await prisma.Platform.findUnique({
      where: {
        name: "Instagram",
      },
    });

    const igCategory = await prisma.Category.findUnique({
      where: {
        name: "Mention",
      },
    });

    const data = user_tags.data.data;
    // const platformId = igPlatform.id;
    // const categoryId = igCategory.id;

    const countsByYear = data.reduce((acc, post) => {
      const date = new Date(post.timestamp);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      let weekNumber = getWeekNumber(date);
      // if (weekNumber > 4) weekNumber = 1;
      if (!acc[year]) acc[year] = {};
      if (!acc[year][month]) acc[year][month] = {};
      if (!acc[year][month][weekNumber]) acc[year][month][weekNumber] = 0;
      acc[year][month][weekNumber]++;
      return acc;
    }, {});

    // data.forEach(async (tag) => {
    //   const tagExist = await prisma.SocialMedia.findUnique({
    //     where: {
    //       caption: tag.caption,
    //     },
    //   });
    //   if (!tagExist) {
    //     const translatedcaption = await translate(tag.caption, {
    //       from: "id",
    //       to: "en",
    //     });

    //     const predict = await axios.post(`${process.env.FLASK_URL}/predict`, {
    //       headline: translatedcaption,
    //     });

    //     await prisma.SocialMedia.create({
    //       data: {
    //         id: tag.id,
    //         username: tag.username,
    //         media_url: tag.media_url,
    //         caption: tag.caption,
    //         like_count: tag.like_count,
    //         comment_count: tag.comments_count,
    //         published_at: new Date(tag.timestamp),
    //         crime_type: predict.data.prediction,
    //         post_url: tag.permalink,
    //         platform_id: platformId,
    //         category_id: categoryId,
    //         user_id: decoded.id,
    //       },
    //     });

    //     return;
    //   }
    // });

    res.json({
      message: "User tags fetched successfully",
      statusCode: 200,
      data: countsByYear,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = getTagPost;
