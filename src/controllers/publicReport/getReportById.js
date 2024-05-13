const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const getReportById = async (req, res) => {
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

    const { id } = req.params;

    const report = await prisma.publicReport.findUnique({
      where: {
        id: id,
      },
    });

    if (!report) {
      return res.status(404).json({
        error: "Not Found",
        message: "Report not found",
      });
    }

    if (report.user_id !== user.id) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You are not authorized to view this report",
      });
    }

    res.json({
      message: "Report details",
      statusCode: 200,
      data: report,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = getReportById;
