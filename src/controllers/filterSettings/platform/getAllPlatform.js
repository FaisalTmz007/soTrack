const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getAllPlatform = async (req, res) => {
  try {
    // Retrieve all platforms
    const platforms = await prisma.Platform.findMany();

    // Return success response with platforms data
    res.status(200).json({
      message: "All platforms retrieved successfully",
      data: platforms,
    });
  } catch (error) {
    // Handle errors
    console.error("Error retrieving platforms:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while retrieving platforms",
    });
  }
};

module.exports = getAllPlatform;
