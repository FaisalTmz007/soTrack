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
      where: {
        id: payload.id,
      },
    });

    if (!user) {
      return res.status(403).json({ error: "User not found" });
    }

    const accessToken = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "15m",
      }
    );

    res.json({
      message: "Access token has been refreshed",
      statusCode: 200,
      data: {
        id: user.id,
        email: user.email,
        accessToken: accessToken,
      },
    });
  } catch (error) {
    res.status(403).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = refreshToken;
