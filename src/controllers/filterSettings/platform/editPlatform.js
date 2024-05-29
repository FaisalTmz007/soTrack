const { PrismaClient } = require("@prisma/client");
const capitalize = require("../../../utils/capitalize");

const prisma = new PrismaClient();

const editPlatform = async (req, res) => {
  const { id } = req.params;
  const { name, logo_url } = req.body;

  try {
    // Validate platform existence
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

    // Update platform
    const platformUpdate = await prisma.Platform.update({
      where: { id },
      data: {
        name: capitalize(name),
        logo_url,
      },
    });

    // Return success response
    res.status(200).json({
      message: "Platform has been updated",
      statusCode: 200,
      data: platformUpdate,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

module.exports = editPlatform;
