const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const isHandled = async (req, res) => {
  try {
    const refresh_token = req.cookies.refresh_token;
    const { public_report_id } = req.params;

    if (!refresh_token || !public_report_id) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide a valid refresh token and public report ID",
      });
    }

    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

    const publicReport = await prisma.publicReport.findUnique({
      where: {
        id: public_report_id,
      },
    });

    if (!publicReport) {
      return res.status(404).json({
        error: "Not Found",
        message: "Public report not found",
      });
    }

    if (decoded.id !== publicReport.user_id) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You are not authorized to handle this report",
      });
    }

    // Toggle the is_handled status
    const updatedReport = await prisma.publicReport.update({
      where: {
        id: public_report_id,
      },
      data: {
        is_handled: !publicReport.is_handled,
      },
    });

    res.json({
      message: `Public report is ${
        updatedReport.is_handled ? "handled" : "unhandled"
      }`,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error handling report:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while handling the report",
    });
  }
};

module.exports = isHandled;
