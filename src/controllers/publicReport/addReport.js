const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const addReport = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { name, email, phone, province, city, message, category_id } =
      req.body;
    const files = req.files;

    // Check if all required fields are provided
    if (!name || !email || !phone || !province || !city || !message) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide all required fields",
      });
    }

    // Create the report
    const report = await prisma.PublicReport.create({
      data: {
        name,
        email,
        phone,
        province,
        city,
        message,
        attachments: files
          ? files.map((file) => file.filename).join(",")
          : null,
        user_id,
        category_id,
      },
    });

    // Return success response with the created report
    res.status(201).json({
      message: "Report has been added successfully",
      data: report,
    });
  } catch (error) {
    // Handle errors
    console.error("Error adding report:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while adding the report",
    });
  }
};

module.exports = addReport;
