const { PrismaClient } = require("@prisma/client");
const capitalize = require("../../../utils/capitalize");

const prisma = new PrismaClient();

const editPlatform = async (req, res) => {
  const { id } = req.params;
  const { name, logo_url } = req.body;
  try {
    const platformName = capitalize(name);

    const platformUpdate = await prisma.Platform.update({
      where: {
        id,
      },
      data: {
        name: platformName,
        logo_url,
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
