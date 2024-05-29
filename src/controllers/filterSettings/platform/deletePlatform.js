const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const deletePlatform = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if platform exists
    const platform = await prisma.Platform.findUnique({
      where: {
        id,
      },
    });

    if (!platform) {
      return res.status(404).json({
        error: "Not Found",
        message: "Platform not found",
      });
    }

    // Delete the platform
    await prisma.Platform.delete({
      where: {
        id,
      },
    });

    // Return success response
    res.status(200).json({
      message: "Platform has been deleted",
      statusCode: 200,
      data: platform,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

module.exports = deletePlatform;
