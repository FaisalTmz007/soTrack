const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const getLinkForm = async (req, res) => {
  try {
    // Validate refresh token
    const refresh_token = req.cookies.refresh_token;
    if (!refresh_token) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide a valid refresh token",
      });
    }

    // Decode refresh token
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

    // Retrieve user from database
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    // Determine frontend URL based on environment
    const frontendUrl =
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:3000";

    // Generate link to the report form
    const link = `${frontendUrl}/form/${user.id}`;

    // Send response with link
    res.json({
      message: "Link form",
      statusCode: 200,
      data: {
        link,
      },
    });
  } catch (error) {
    // Handle errors
    console.error("Error generating link to form:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while generating the link to the form",
    });
  }
};

module.exports = getLinkForm;
