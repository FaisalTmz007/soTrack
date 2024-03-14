const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const deleteFilter = async (req, res) => {
  const { id } = req.params;
  const refresh_token = req.cookies.refresh_token;

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
