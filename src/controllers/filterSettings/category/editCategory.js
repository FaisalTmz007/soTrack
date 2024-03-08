const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const editCategory = async (req, res) => {
  const { id } = req.query;
  const { name } = req.body;
  try {
    const category = await prisma.Category.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });

    res.json({
      message: "Category has been updated",
      statusCode: 200,
      data: category,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = editCategory;
