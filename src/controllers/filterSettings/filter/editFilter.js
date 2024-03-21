const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const capitalize = require("../../../utils/capitalize");
const prisma = new PrismaClient();

const editFilter = async (req, res) => {
  const { id } = req.params;
  const { parameter, is_active } = req.body;
  const access_token = req.headers["authorization"];

  try {
    const token = access_token && access_token.split(" ")[1];
    if (token == null) return res.sendStatus(401);

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const filter = await prisma.Filter.findFirst({
      where: {
        user_id: decoded.id,
      },
    });

    if (filter.user_id !== decoded.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const filterUpdate = await prisma.Filter.update({
      where: {
        id,
      },
      data: {
        parameter: capitalize(parameter),
        is_active: is_active,
      },
    });

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
