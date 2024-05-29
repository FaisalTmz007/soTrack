const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const getAllEmail = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide a valid refresh token",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const { since, until, page = 1, limit = 10, q } = req.query; // Default limit to 10, default page to 1
    const skip = (page - 1) * limit;
    const where = {
      user_id: decoded.id,
      createdAt: {
        gte: new Date(since),
        lte: new Date(until),
      },
    };

    if (q) {
      where.message = {
        contains: q,
      };
    }

    const emails = await prisma.emailBroadcast.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    res.json({
      message: q ? `All emails containing "${q}"` : "All emails",
      statusCode: 200,
      data: emails,
    });
  } catch (error) {
    console.error("Error fetching emails:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = getAllEmail;
