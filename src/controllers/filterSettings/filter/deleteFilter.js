const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const deleteFilter = async (req, res) => {
  const { id } = req.params;

  try {
    const filterDelete = await prisma.Filter.delete({
      where: {
        id,
      },
    });

    res.json({
      message: "Filter has been deleted",
      statusCode: 200,
      data: filterDelete,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = deleteFilter;
