const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const getAllReport = async (req, res) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    if (!refresh_token) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide a valid refresh token",
      });
    }

    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    const {
      q,
      since,
      until,
      is_handled = false,
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (page - 1) * limit;

    if (q) {
      if (is_handled) {
        const reports = await prisma.publicReport.findMany({
          where: {
            user_id: user.id,
            message: {
              contains: q,
            },
            created_at: {
              gte: new Date(since),
              lte: new Date(until),
            },
            is_handled: true,
          },
          skip: parseInt(skip),
          take: parseInt(limit),
        });

        return res.json({
          message: `All reports containing ${q}`,
          statusCode: 200,
          data: reports,
        });
      } else {
        const reports = await prisma.publicReport.findMany({
          where: {
            user_id: user.id,
            message: {
              contains: q,
            },
            created_at: {
              gte: new Date(since),
              lte: new Date(until),
            },
            is_handled: false,
          },
          skip: parseInt(skip),
          take: parseInt(limit),
        });

        return res.json({
          message: `All reports containing ${q}`,
          statusCode: 200,
          data: reports,
        });
      }
    } else {
      if (is_handled) {
        const reports = await prisma.publicReport.findMany({
          where: {
            user_id: user.id,
            created_at: {
              gte: new Date(since),
              lte: new Date(until),
            },
            is_handled: true,
          },
          skip: parseInt(skip),
          take: parseInt(limit),
        });

        return res.json({
          message: "All reports",
          statusCode: 200,
          data: reports,
        });
      } else {
        const reports = await prisma.publicReport.findMany({
          where: {
            user_id: user.id,
            created_at: {
              gte: new Date(since),
              lte: new Date(until),
            },
            is_handled: false,
          },
          skip: parseInt(skip),
          take: parseInt(limit),
        });

        return res.json({
          message: "All reports",
          statusCode: 200,
          data: reports,
        });
      }
    }
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = getAllReport;
