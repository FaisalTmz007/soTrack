const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const addCategory = async (req, res) => {
  const { name } = req.body;
  try {
    const category = await prisma.Category.create({
      data: {
        name,
      },
    });

    res.json({
      message: "Category has been added",
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

module.exports = addCategory;
