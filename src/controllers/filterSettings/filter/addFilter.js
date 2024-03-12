const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const addFilter = async (req, res) => {
  const { parameter, user_id, platform_id, category_id } = req.body;

  try {
    const filter = await prisma.Filter.create({
      data: {
        parameter,
        user_id,
        platform_id,
        category_id,
      },
    });

    res.json({
      message: "Filter has been added",
      statusCode: 200,
      data: filter,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = addFilter;
