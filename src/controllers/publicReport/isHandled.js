const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const isHandled = async (req, res) => {
  try {
    const refresh_token = req.cookies.refresh_token;
    const { public_report_id } = req.params;

    if (!refresh_token) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide a valid refresh token",
      });
    }

    if (!public_report_id) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide a valid public report id",
      });
    }

    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    const publicReport = await prisma.publicReport.findFirst({
      where: {
        id: public_report_id,
      },
    });

    if (!publicReport) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Public report not found",
      });
    }

    if (user.id !== publicReport.user_id) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You are not authorized to handle this report",
      });
    }

    if (publicReport.is_handled) {
      await prisma.publicReport.update({
        where: {
          id: public_report_id,
        },
        data: {
          is_handled: false,
        },
      });

      return res.json({
        message: "Public report is unhandled",
        statusCode: 200,
      });
    } else {
      await prisma.publicReport.update({
        where: {
          id: public_report_id,
        },
        data: {
          is_handled: true,
        },
      });

      return res.json({
        message: "Public report is handled",
        statusCode: 200,
      });
    }
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = isHandled;
