const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const criminalReport = async (req, res) => {
  try {
    // count data from post table group by published_at in every 1 month
    const data = await prisma.post.findMany({
      select: {
        published_at: true,
        id: true,
      },
    });

    const countsByYear = data.reduce((acc, post) => {
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
