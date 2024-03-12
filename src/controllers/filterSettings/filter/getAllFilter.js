const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getAllFilter = async (req, res) => {
  const { platform } = req.query;
  try {
    if (platform) {
      const filters = await prisma.Filter.findMany({
        where: {
          platform,
        },
      });

      res.json({
        message: "All filters",
        statusCode: 200,
        data: filters,
      });
      return;
    }

    const filters = await prisma.Filter.findMany();

    res.json({
      message: "All filters",
      statusCode: 200,
      data: filters,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = getAllFilter;
