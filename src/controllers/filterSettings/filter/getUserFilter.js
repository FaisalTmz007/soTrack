const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const getUserFilter = async (req, res) => {
  const { platform } = req.query;
  const refreshToken = req.cookies.refresh_token;

  try {
    // Check if refresh token is present
    if (!refreshToken) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "Refresh token missing" });
    }

    // Verify refresh token and decode user ID
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Define filter search criteria
    const filterSearchCriteria = { user_id: decoded.id };
    if (platform) {
      filterSearchCriteria.platform_id = platform;
    }

    // Retrieve filters from the database
    const filters = await prisma.filter.findMany({
      where: filterSearchCriteria,
    });

    // Return the retrieved filters
    res.status(200).json({
      message: "Filters retrieved successfully",
      statusCode: 200,
      data: filters,
    });
  } catch (error) {
    // Handle errors
    res
      .status(400)
      .json({ error: "An error has occurred", message: error.message });
  }
};

module.exports = getUserFilter;
