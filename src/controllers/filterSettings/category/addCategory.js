const { PrismaClient } = require("@prisma/client");
const capitalize = require("../../../utils/capitalize");

const prisma = new PrismaClient();

const addCategory = async (req, res) => {
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

    const categoryCreate = await prisma.Category.create({
      data: {
        name: categoryName,
      },
    });

    res.json({
      message: "Category has been added",
      statusCode: 200,
      data: categoryCreate,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = addCategory;
