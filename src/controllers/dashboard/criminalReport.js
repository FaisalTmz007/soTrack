const { PrismaClient } = require("@prisma/client");
const { getISOWeek } = require("date-fns");

const prisma = new PrismaClient();

const criminalReport = async (req, res) => {
  try {
    const { range } = req.query;
    // count data from post table group by published_at in every 1 month
    const data = await prisma.post.findMany({
      select: {
        published_at: true,
        id: true,
      },
    });

    if (range === "monthly") {
      // Transform the dates to the desired format and count posts for each month
      const countsByMonth = data.reduce((acc, post) => {
        const date = new Date(post.published_at);
        const monthYearKey = `${date.getMonth() + 1}-${date.getFullYear()}`;
        acc[monthYearKey] = (acc[monthYearKey] || 0) + 1;
        return acc;
      }, {});

      // Convert the counts to the desired format
      const formattedCounts = Object.entries(countsByMonth).map(
        ([month, count]) => ({
          month,
          count,
        })
      );

      res.json({
        message: "Data has been fetched",
        statusCode: 200,
        data: formattedCounts,
      });
    } else if (range === "weekly") {
      // Transform the dates to the desired format and count posts for each week
      const countsByWeek = data.reduce((acc, post) => {
        const date = new Date(post.published_at);
        const weekYearKey = `${getISOWeek(date)}-${date.getFullYear()}`;
        acc[weekYearKey] = (acc[weekYearKey] || 0) + 1;
        return acc;
      }, {});

      // Convert the counts to the desired format
      const formattedCounts = Object.entries(countsByWeek).map(
        ([week, count]) => ({
          week,
          count,
        })
      );

      res.json({
        message: "Data has been fetched",
        statusCode: 200,
        data: formattedCounts,
      });
    } else if (range === "yearly") {
      // Transform the dates to the desired format and count posts for each year
      const countsByYear = data.reduce((acc, post) => {
        const date = new Date(post.published_at);
        const year = date.getFullYear();
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {});

      // Convert the counts to the desired format
      const formattedCounts = Object.entries(countsByYear).map(
        ([year, count]) => ({
          year,
          count,
        })
      );

      res.json({
        message: "Data has been fetched",
        statusCode: 200,
        data: formattedCounts,
      });
    }
  } catch (error) {
    res.status(400).json({
      error: "An error has occurred",
      message: error.message,
    });
  }
};

module.exports = criminalReport;
