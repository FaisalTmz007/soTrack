const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const getAllReports = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide a valid refresh token",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
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
    const where = {
      user_id: user.id,
      createdAt: { gte: new Date(since), lte: new Date(until) },
      ...(q && { message: { contains: q } }),
    };

    const reports = await prisma.publicReport.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const message = q ? `All reports containing "${q}"` : "All reports";

    res.json({
      message,
      statusCode: 200,
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while fetching reports",
    });
  }
};

module.exports = getAllReports;
