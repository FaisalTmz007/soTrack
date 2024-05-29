const { PrismaClient } = require("@prisma/client");
const capitalize = require("../../../utils/capitalize");

const prisma = new PrismaClient();

const addPlatform = async (req, res) => {
  const { name, logo_url } = req.body;

  try {
    // Capitalize the platform name
    const platformName = capitalize(name);

    // Check if platform already exists
    const existingPlatform = await prisma.Platform.findUnique({
      where: {
        name: platformName,
      },
    });

    if (existingPlatform) {
      return res.status(400).json({
        error: "Platform already exists",
        message: "Platform already exists",
      });
    }

    // Create new platform
    const newPlatform = await prisma.Platform.create({
      data: {
        name: platformName,
        logo_url,
      },
    });

    // Return success response
    res.status(200).json({
      message: "Platform has been added",
      statusCode: 200,
      data: newPlatform,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

module.exports = addPlatform;
