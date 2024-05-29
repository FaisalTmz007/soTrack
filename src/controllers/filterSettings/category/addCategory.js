const { PrismaClient } = require("@prisma/client");
const capitalize = require("../../../utils/capitalize");

const prisma = new PrismaClient();

const addCategory = async (req, res) => {
  const { name } = req.body;
  const categoryName = capitalize(name);

  try {
    const existingCategory = await prisma.category.findUnique({
      where: {
        name: categoryName,
      },
    });

    if (existingCategory) {
      return res.status(400).json({
        error: "Category already exists",
        message: "Category already exists",
      });
    }

    const newCategory = await prisma.category.create({
      data: {
        name: categoryName,
      },
    });

    res.status(201).json({
      message: "Category has been added",
      statusCode: 201,
      data: newCategory,
    });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = addCategory;
