const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const getAllEmail = async (req, res) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    if (!refresh_token) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide a valid refresh token",
      });
    }

    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

    const { since, until, page = 1, limit = 10 } = req.query; // Default limit to 10, default page to 1
    const skip = (page - 1) * limit;

    if (req.query.q) {
      const emails = await prisma.EmailBroadcast.findMany({
        where: {
          user_id: decoded.id,
          message: {
            contains: req.query.q,
          },
          createdAt: {
            gte: new Date(since),
            lte: new Date(until),
          },
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });

      return res.json({
        message: `All emails containing ${req.query.q}`,
        statusCode: 200,
        data: emails,
      });
    }

    const emails = await prisma.EmailBroadcast.findMany({
      where: {
        user_id: decoded.id,
        createdAt: {
          gte: new Date(since),
          lte: new Date(until),
        },
      },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    res.json({
      message: "All emails",
      statusCode: 200,
      data: emails,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occurred",
      message: error.message,
    });
  }
};

module.exports = getAllEmail;
