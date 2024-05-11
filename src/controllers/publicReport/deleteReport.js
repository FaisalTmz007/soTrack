const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");

const deleteReport = async (req, res) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    if (!refresh_token) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide a valid refresh token",
      });
    }

    const { public_report_id } = req.params;

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
        message: "You are not authorized to delete this report",
      });
    }

    // Delete files from local storage
    if (publicReport.attachments) {
      const files = publicReport.attachments.split(",");
      files.forEach((file) => {
        fs.unlinkSync(path.join(__dirname, `../../../public/uploads/${file}`));
      });
    }

    await prisma.publicReport.delete({
      where: {
        id: public_report_id,
      },
    });

    res.json({
      message: "Report has been deleted",
      statusCode: 200,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = deleteReport;
