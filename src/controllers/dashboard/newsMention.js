const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const newsMention = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    console.log("🚀 ~ socialMediaMention ~ decoded:", decoded);

    const filter = await prisma.filter.findMany({
      where: {
        is_active: true,
        user_id: decoded.id,
        Platform: {
          name: "News",
        },
      },
      select: {
        id: true,
        parameter: true,
        Platform: {
          select: {
            name: true,
          },
        },
        Category: {
          select: {
            name: true,
          },
        },
        User: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (filter.length === 0) {
      const news = await prisma.News.findMany();
      return res.json({
        message: "No filters found",
        statusCode: 200,
        data: news.length === 0 ? "No news found" : news.length,
      });
    } else {
      const newsResults = await Promise.all(
        filter.map(async (f) => {
          const news = await prisma.News.findMany({
            where: {
              title: {
                contains: f.parameter,
              },
            },
          });
          return {
            news,
          };
        })
      );
      return res.json({
        message: "Filters have been retrieved",
        statusCode: 200,
        data: {
          news:
            newsResults.length === 0
              ? "No news found"
              : newsResults[0].news.length,
        },
      });
    }
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = newsMention;
