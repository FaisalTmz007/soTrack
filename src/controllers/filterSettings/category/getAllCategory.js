const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getAllCategory = async (req, res) => {
  try {
    const categories = await prisma.Category.findMany();

    res.json({
      message: "All categories",
      statusCode: 200,
      data: categories,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = getAllCategory;
