const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const deleteCategory = async (req, res) => {
  const { id } = req.query;
  try {
    const category = await prisma.Category.delete({
      where: {
        id,
      },
    });

    res.json({
      message: "Category has been deleted",
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

module.exports = deleteCategory;
