const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const fs = require("fs").promises;
const path = require("path");

const prisma = new PrismaClient();

const deleteEmailById = async (req, res) => {
  const { id } = req.params;
  const refreshToken = req.cookies.refresh_token;

  try {
    if (!refreshToken) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Refresh token missing",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const email = await prisma.emailBroadcast.findUnique({
      where: {
        id,
      },
    });

    if (!email) {
      return res.status(404).json({
        error: "Not Found",
        message: "Email not found",
      });
    }

    if (email.user_id !== decoded.id) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You are not authorized to delete this email",
      });
    }

    // Delete files from local storage
    if (email.attachments) {
      const files = email.attachments.split(",");
      await Promise.all(
        files.map(async (file) => {
          try {
            await fs.unlink(
              path.join(__dirname, `../../../public/uploads/${file}`)
            );
          } catch (error) {
            console.error("Error deleting file:", error);
          }
        })
      );
    }

    await prisma.emailBroadcast.delete({
      where: {
        id,
      },
    });

    res.json({
      message: "Email has been deleted",
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error deleting email:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

module.exports = deleteEmailById;
