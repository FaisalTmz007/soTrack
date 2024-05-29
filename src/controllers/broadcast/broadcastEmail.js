const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const sendEmail = require("../../services/emailService");
require("dotenv").config();

const prisma = new PrismaClient();

const broadcastEmail = async (req, res) => {
  try {
    const { email, subject, date, city, message } = req.body;
    const files = req.files;
    const refreshToken = req.cookies.refresh_token;

    // Validate input data
    if (!refreshToken) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide a valid refresh token",
      });
    }

    if (!email || !subject || !date || !city || !message) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Missing required fields",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const fullMessage = `
      <p>Tanggal: ${date}</p>
      <p>Kota: ${city}</p>
      <br>
      <p>${message}</p>
    `;

    // Send the email
    await sendEmail(email, subject, fullMessage, files);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Save email broadcast to the database
    await prisma.emailBroadcast.create({
      data: {
        receipient: email,
        subject,
        message,
        date: new Date(date),
        city,
        user_id: user.id,
        attachments: files.map((file) => file.filename).join(","),
      },
    });

    res.json({
      message: "Congratulations, your email broadcast was successfully sent.",
      statusCode: 200,
      data: {
        to: email,
        subject,
        message: fullMessage,
        attachments: files.map((file) => file.filename),
      },
    });
  } catch (error) {
    console.error("Error during broadcast email:", error); // Log the error for debugging
    res.status(500).json({
      error: "An error has occurred",
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = broadcastEmail;
