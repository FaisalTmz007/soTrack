const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const getReportById = async (req, res) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    // Ensure that the refresh token is provided
    if (!refresh_token) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide a valid refresh token",
      });
    }

    // Verify the refresh token
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

    // Fetch the user details from the database
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    // Ensure that the user exists
    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
    }

    // Extract the report ID from the request parameters
    const { id } = req.params;

    // Fetch the report details from the database
    const report = await prisma.publicReport.findUnique({
      where: {
        id, // Ensure that the ID is parsed as an integer
      },
    });

    // Ensure that the report exists
    if (!report) {
      return res.status(404).json({
        error: "Not Found",
        message: "Report not found",
      });
    }

    // Perform authorization check: Ensure that the user is authorized to view the report
    if (report.user_id !== user.id) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You are not authorized to view this report",
      });
    }

    // Send the report details in the response
    res.json({
      message: "Report details",
      statusCode: 200,
      data: report,
    });
  } catch (error) {
    // Handle errors
    console.error("Error retrieving report:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while retrieving the report",
    });
  }
};

module.exports = getReportById;
