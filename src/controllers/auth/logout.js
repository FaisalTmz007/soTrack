const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const prisma = new PrismaClient();

const logout = async (req, res) => {
  try {
    // Retrieve refresh token from cookies
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ error: "Access denied, token missing!" });
    }

    const decodedRefreshToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const userToken = await prisma.userToken.findFirst({
      where: {
        user_id: decodedRefreshToken.id,
      },
    });

    if (!userToken) {
      return res.status(404).json({ error: "Token not found" });
    }

    // Delete refresh token from database
    await prisma.userToken.delete({
      where: {
        id: userToken.id,
      },
    });

    res.clearCookie("refresh_token").json({
      message: "Logout successful",
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error during logout:", error); // Log the error for debugging
    res.status(500).json({
      error: "An error has occurred",
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = logout;
