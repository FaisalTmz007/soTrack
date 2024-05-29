const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getAllCategory = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();

    return res.status(200).json({
      message: "All categories",
      statusCode: 200,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while fetching categories",
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = getAllCategory;
