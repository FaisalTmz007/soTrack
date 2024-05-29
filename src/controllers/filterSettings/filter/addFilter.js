const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const addFilter = async (req, res) => {
  const { parameter, platform_id, category_id } = req.body;
  const access_token = req.headers["authorization"];

  try {
    // Validate access token
    if (!access_token) {
      return res.status(401).json({ error: "Access token missing" });
    }

    const token = access_token.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Invalid access token format" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user_id = decoded.id;

    // Check if filter already exists for the user, platform, and parameter
    const existingFilter = await prisma.filter.findFirst({
      where: {
        parameter,
        user_id,
        platform_id,
      },
    });

    if (existingFilter) {
      return res.status(400).json({ error: "Filter already exists" });
    }

    // Create the filter
    const newFilter = await prisma.filter.create({
      data: {
        parameter,
        user_id,
        platform_id,
        category_id,
      },
    });

    res.status(200).json({
      message: "Filter has been added",
      statusCode: 200,
      data: newFilter,
    });
  } catch (error) {
    console.error("Error adding filter:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while adding the filter",
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = addFilter;
