const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const capitalize = require("../../../utils/capitalize");

const prisma = new PrismaClient();

const addFilter = async (req, res) => {
  const { parameter, platform_id, category_id } = req.body;
  const token = req.cookies.refresh_token;

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user_id = decoded.id;
    // console.log(user_id);

    const parameterName = capitalize(parameter);

    const filter = await prisma.Filter.create({
      data: {
        parameter: parameterName,
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
