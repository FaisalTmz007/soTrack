const { PrismaClient } = require("@prisma/client");
const capitalize = require("../../../utils/capitalize");
const prisma = new PrismaClient();

const editCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const categoryUpdate = await prisma.Category.update({
      where: {
        id,
      },
      data: {
        name: capitalize(name),
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
