const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const addReport = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { name, email, phone, province, city, message, category_id } =
      req.body;
    const files = req.files;

    if (!name || !email || !phone || !province || !city || !message) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide all required fields",
      });
    }

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

    res.json({
      message: "Report has been added",
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

module.exports = addReport;
