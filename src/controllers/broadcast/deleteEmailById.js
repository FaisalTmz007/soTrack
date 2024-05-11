const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const deleteEmailById = async (req, res) => {
  const { id } = req.params;
  const refresh_token = req.cookies.refresh_token;

  try {
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

    const email = await prisma.EmailBroadcast.findUnique({
      where: {
        id: id,
      },
    });

    if (email.user_id !== decoded.id) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You are not authorized to delete this email",
      });
    }

    // Delete files from local storage
    if (email.attachments) {
      const files = email.attachments.split(",");
      files.forEach((file) => {
        fs.unlinkSync(path.join(__dirname, `../../../public/uploads/${file}`));
      });
    }

    await prisma.EmailBroadcast.delete({
      where: {
        id: id,
      },
    });

    res.json({
      message: "Email has been deleted",
      statusCode: 200,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = deleteEmailById;
