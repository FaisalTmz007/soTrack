const { PrismaClient } = require("@prisma/client");
const capitalize = require("../../../utils/capitalize");

const prisma = new PrismaClient();

const addPlatform = async (req, res) => {
  const { name, logo_url } = req.body;

  try {
    const platformName = capitalize(name);
    const platform = await prisma.Platform.findUnique({
      where: {
        name: platformName,
        logo_url,
      },
    });

    if (platform) {
      return res.status(400).json({
        error: "Platform already exists",
        message: "Platform already exists",
      });
    }

    const platformCreate = await prisma.Platform.create({
      data: {
        name: platformName,
      },
    });

    res.json({
      message: "Platform has been added",
      statusCode: 200,
      data: platformCreate,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = addPlatform;
