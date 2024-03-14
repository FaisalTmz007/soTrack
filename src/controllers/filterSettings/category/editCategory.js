const { PrismaClient } = require("@prisma/client");
const capitalize = require("../../../utils/capitalize");
const prisma = new PrismaClient();

const editCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const categoryName = capitalize(name);

  try {
    const category = await prisma.Category.findUnique({
      where: {
        name: categoryName,
      },
    });

    if (category) {
      return res.status(400).json({
        error: "Category already exists",
        message: "Category already exists",
      });
    }

    const categoryUpdate = await prisma.Category.update({
      where: {
        id,
      },
      data: {
        name: categoryName,
      },
    });

    res.json({
      message: "Category has been updated",
      statusCode: 200,
      data: categoryUpdate,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = editCategory;
