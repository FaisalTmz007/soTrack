const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const deletePlatform = async (req, res) => {
  const { id } = req.params;
  try {
    const platform = await prisma.Platform.delete({
      where: {
        id,
      },
    });

    res.json({
      message: "Platform has been deleted",
      statusCode: 200,
      data: platform,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = deletePlatform;
