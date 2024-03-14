const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const capitalize = require("../../../utils/capitalize");
const prisma = new PrismaClient();

const editFilter = async (req, res) => {
  const { id } = req.params;
  const refresh_token = req.cookies.refresh_token;
  // const { parameter } = req.body;

  // Has multiple parameters (parameter and is_active), but the code runs even if you only fill in one of the parameters
  const { parameter, is_active } = req.body;

  try {
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    console.log(decoded);

    const filter = await prisma.Filter.findFirst({
      where: {
        id,
      },
    });

    if (filter.user_id !== decoded.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    // console.log(typeof is_active);
    const filterUpdate = await prisma.Filter.update({
      where: {
        id,
      },
      data: {
        parameter: parameter ? capitalize(parameter) : filter.parameter,
        is_active:
          typeof is_active !== "undefined" ? is_active : filter.is_active,
      },
    });

    // const parameterName = capitalize(parameter);
    // const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

    // const filter = await prisma.Filter.findFirst({
    //   where: {
    //     id,
    //   },
    // });

    // if (filter.user_id !== decoded.id) {
    //   return res.status(403).json({ error: "Access denied" });
    // }

    // const filterUpdate = await prisma.Filter.update({
    //   where: {
    //     id,
    //   },
    //   data: {
    //     parameter: parameterName,
    //   },
    // });

    res.json({
      message: "Filter has been updated",
      statusCode: 200,
      data: filterUpdate,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = editFilter;
