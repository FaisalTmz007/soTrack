const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const deleteFilter = async (req, res) => {
  const { id } = req.params;
  const access_token = req.headers["authorization"];

  try {
    const token = access_token && access_token.split(" ")[1];
    if (token == null) return res.sendStatus(401);
    // console.log("ini token: " + token);

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const filter = await prisma.Filter.findFirst({
      where: {
        user_id: decoded.id,
      },
    });
    // console.log(filter);

    if (filter.user_id !== decoded.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    const filterDelete = await prisma.Filter.delete({
      where: {
        id,
      },
    });

    res.json({
      message: "Filter has been deleted",
      statusCode: 200,
      data: filterDelete,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = deleteFilter;
