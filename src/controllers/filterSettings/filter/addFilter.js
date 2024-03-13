const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const addFilter = async (req, res) => {
  const { parameter, platform_id, category_id } = req.body;
  const token = req.cookies.refresh_token;

  const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

  const user_id = decoded.id;
  console.log(user_id);

  try {
    const filter = await prisma.Filter.create({
      data: {
        parameter,
        user_id: parseInt(user_id),
        platform_id: parseInt(platform_id),
        category_id: parseInt(category_id),
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
