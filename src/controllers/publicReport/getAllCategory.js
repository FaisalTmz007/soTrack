const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.PublicReportCategory.findMany();

    res.json({
      message: "All categories retrieved successfully",
      statusCode: 200,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while retrieving categories",
    });
  }
};

module.exports = getAllCategories;
