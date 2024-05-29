const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");

// Function to delete files from local storage
const deleteFiles = async (attachments) => {
  if (!attachments) return;
  const files = attachments.split(",");
  files.forEach((file) => {
    fs.unlinkSync(path.join(__dirname, `../../../public/uploads/${file}`));
  });
};

// Function to find public report by ID
const findPublicReportById = async (id) => {
  return await prisma.publicReport.findFirst({
    where: { id },
  });
};

const deleteReport = async (req, res) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    if (!refresh_token) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Refresh token missing",
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
      where: { id: decoded.id },
    });

    const publicReport = await findPublicReportById(public_report_id);

    if (!publicReport) {
      return res.status(404).json({
        error: "Not Found",
        message: "Public report not found",
      });
    }

    if (user.id !== publicReport.user_id) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You are not authorized to delete this report",
      });
    }

    // Delete files from local storage
    await deleteFiles(publicReport.attachments);

    // Delete the report from the database
    await prisma.publicReport.delete({
      where: { id: public_report_id },
    });

    res.json({
      message: "Report has been deleted",
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while deleting the report",
    });
  }
};

module.exports = deleteReport;
