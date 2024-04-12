const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getTagPost = async (req, res) => {
  try {
    const token = req.user.accessToken;
    const fb_id = req.user.id;

    const response = await axios.get(
      `https://graph.facebook.com/v19.0/${fb_id}/accounts`,
      {
        params: {
          fields: "instagram_business_account",
          access_token: token,
        },
      }
    );
    const ig_id = response.data.data[0].instagram_business_account.id;
    // console.log("🚀 ~ getTagPost ~ ig_id:", ig_id);

    const user_tags = await axios.get(
      `https://graph.facebook.com/v19.0/${ig_id}/tags`,
      {
        params: {
          fields:
            "id,username,timestamp,comments_count,like_count,caption,permalink",
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
    const platformId = igPlatform.id;
    const categoryId = igCategory.id;

    data.forEach(async (tag) => {
      const tagExist = await prisma.Post.findUnique({
        where: {
          caption: tag.caption,
        },
      });
      if (!tagExist) {
        await prisma.Post.create({
          data: {
            author: tag.id,
            caption: tag.caption,
            likes: tag.like_count,
            comments: tag.comments_count,
            published_at: new Date(tag.timestamp),
            post_url: tag.permalink,
            platform_id: platformId,
            category_id: categoryId,
          },
        });
      }
    });

    res.json({
      message: "User tags fetched successfully",
      statusCode: 200,
      data: {
        user_tags: data,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = getTagPost;
