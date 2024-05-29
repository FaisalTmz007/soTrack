const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();
require("dotenv").config();

const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(403).json({ error: "Access denied, token missing!" });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const accessToken = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    res.header("Authorization", `Bearer ${accessToken}`).json({
      message: "Access token has been refreshed",
      statusCode: 200,
      data: {
        id: user.id,
        email: user.email,
        accessToken,
      },
    });
  } catch (error) {
    console.error("Error refreshing token:", error); // Log the error for debugging
    res.status(403).json({
      error: "Invalid or expired token",
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = refreshToken;
