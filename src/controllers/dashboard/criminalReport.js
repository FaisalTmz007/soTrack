const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

// INI PERLU DI UBAH

const criminalReport = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const filter = await prisma.filter.findMany({
      where: {
        is_active: true,
        user_id: decoded.id,
      },
    });

    if (filter.length === 0) {
      return res.json({
        message: "No filters found",
        statusCode: 200,
        data: "No news found",
      });
    }

    let allNews = [];

    await Promise.all(
      filter.map(async (f) => {
        const news = await prisma.News.findMany({
          where: {
            title: {
              contains: f.parameter,
            },
          },
        });

        // if news length 0 dont include in the array
        if (news.length === 0) return [];

        news.forEach((n) => {
          allNews.push(n);
        });

        return {
          news,
        };
      })
    );

    const countsByYear = allNews.reduce((acc, post) => {
      const date = new Date(post.published_at);
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
    console.log("🚀 ~ countsByYear ~ countsByYear:", countsByYear);

    res.json({
      message: "Data has been fetched",
      statusCode: 200,
      data: countsByYear,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occurred",
      message: error.message,
    });
  }
};

// Function to get the week number of a given date
function getWeekNumber(date) {
  const oneJan = new Date(date.getFullYear(), 0, 1);
  const millisecondsInDay = 86400000;
  return Math.ceil(
    ((date - oneJan) / millisecondsInDay + oneJan.getDay() + 1) / 7
  );
}

module.exports = criminalReport;
