const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getAllPlatform = async (req, res) => {
  try {
    const platforms = await prisma.Platform.findMany();

    res.json({
      message: "All platforms",
      statusCode: 200,
      data: platforms,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = getAllPlatform;
