const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await prisma.category.delete({
      where: {
        id,
      },
    });

    if (!category) {
      return res.status(404).json({
        error: "Not Found",
        message: "Category not found",
      });
    }

    res.json({
      message: "Category has been deleted",
      statusCode: 200,
      data: category,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = deleteCategory;
