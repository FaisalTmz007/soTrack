const { PrismaClient } = require("@prisma/client");
const capitalize = require("../../../utils/capitalize");

const prisma = new PrismaClient();

const editCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const existingCategory = await prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!existingCategory) {
      return res.status(404).json({
        error: "Not Found",
        message: "Category not found",
      });
    }

    const updatedCategory = await prisma.category.update({
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
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = editCategory;
