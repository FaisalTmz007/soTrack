const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const editFilter = async (req, res) => {
  const { id } = req.params;
  const { parameter } = req.body;

  try {
    const filter = await prisma.Filter.update({
      where: {
        id: parseInt(id),
      },
      data: {
        parameter,
      },
    });

    res.json({
      message: "Filter has been updated",
      statusCode: 200,
      data: filter,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = editFilter;
