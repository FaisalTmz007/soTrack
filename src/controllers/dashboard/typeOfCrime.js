const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const typeOfCrime = async (req, res) => {
  try {
  } catch (error) {
    res.status(400).json({
      error: "An error has occurred",
      message: error.message,
    });
  }
};

module.exports = typeOfCrime;
