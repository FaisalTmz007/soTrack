const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const capitalize = require("../../../utils/capitalize");

const prisma = new PrismaClient();

const addFilter = async (req, res) => {
  const { parameter, platform_id, category_id } = req.body;
  const access_token = req.headers["authorization"];

  try {
    const token = access_token && access_token.split(" ")[1];
    if (token == null) return res.sendStatus(401);

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
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
