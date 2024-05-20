const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const newsMention = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    // console.log("🚀 ~ socialMediaMention ~ decoded:", decoded);

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

      const countsByYear = newsResults[0].news.reduce((acc, curr) => {
        const date = new Date(curr.published_at);

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

      return res.json({
        message: "Filters have been retrieved",
        statusCode: 200,
        data: {
          total: newsResults[0].news.length,
          news: countsByYear,
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

function getWeekNumber(date) {
  const oneJan = new Date(date.getFullYear(), 0, 1);
  const millisecondsInDay = 86400000;
  return Math.ceil(
    ((date - oneJan) / millisecondsInDay + oneJan.getDay() + 1) / 7
  );
}

module.exports = newsMention;
