const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const getEmailById = async (req, res) => {
  const { id } = req.params;
  const refreshToken = req.cookies.refresh_token;

  try {
    if (!refreshToken) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Refresh token missing",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const email = await prisma.emailBroadcast.findUnique({
      where: {
        id,
      },
    });

    if (!email) {
      return res.status(404).json({
        error: "Not Found",
        message: "Email not found",
      });
    }

    if (email.user_id !== decoded.id) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You are not authorized to view this email",
      });
    }

    res.json({
      message: "Email has been fetched",
      statusCode: 200,
      data: {
        sender: decoded.email,
        email,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = getEmailById;
