const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const getUserFilter = async (req, res) => {
  const { platform } = req.query;
  const refresh_token = req.cookies.refresh_token;

  try {
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    if (platform) {
      const filters = await prisma.Filter.findMany({
        where: {
          platform_id: platform,
          user_id: decoded.id,
        },
      });

      res.json({
        message: "All filters",
        statusCode: 200,
        data: filters,
      });
      return;
    }

    const filters = await prisma.Filter.findMany({
      where: {
        user_id: decoded.id,
      },
    });

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

module.exports = getUserFilter;
