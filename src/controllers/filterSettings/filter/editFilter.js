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
    if (!token) return res.sendStatus(401);

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const filter = await prisma.Filter.findFirst({
      where: {
        id,
        user_id: decoded.id,
      },
    });

    if (!filter || filter.user_id !== decoded.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    let updateData = {};
    if (parameter) {
      updateData.parameter = capitalize(parameter);
    }
    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const filterUpdate = await prisma.Filter.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      message: "Filter has been updated",
      statusCode: 200,
      data: filterUpdate,
    });
  } catch (error) {
    return res.status(400).json({
      error: "An error has occurred",
      message: error.message,
    });
  }
};

module.exports = editFilter;
