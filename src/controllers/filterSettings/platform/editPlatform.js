const { PrismaClient } = require("@prisma/client");
const capitalize = require("../../../utils/capitalize");

const prisma = new PrismaClient();

const editPlatform = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const platformName = capitalize(name);

    const platform = await prisma.Platform.findUnique({
      where: {
        name: platformName,
      },
    });

    if (platform) {
      return res.status(400).json({
        error: "Platform already exists",
        message: "Platform already exists",
      });
    }

    const platformUpdate = await prisma.Platform.update({
      where: {
        id,
      },
      data: {
        name: platformName,
      },
    });

    res.json({
      message: "Platform has been updated",
      statusCode: 200,
      data: platformUpdate,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = editPlatform;
