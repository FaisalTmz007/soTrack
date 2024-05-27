const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const sendEmail = require("../../services/emailService");

const broadcastEmail = async (req, res) => {
  try {
    const { email, subject, date, city, message } = req.body;
    const files = req.files;
    const refresh_token = req.cookies.refresh_token;

    if (!refresh_token) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Please provide a valid refresh token",
      });
    }

    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

    const fullMessage = `
  <p>Tanggal: ${date}</p>
  <p>Kota: ${city}</p>
  <br>
  <p>${message}</p>
`;

    await sendEmail(email, subject, fullMessage, files);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    // change file filename into url

    await prisma.EmailBroadcast.create({
      data: {
        receipient: email,
        subject: subject,
        message: message,
        date: new Date(date),
        city: city,
        user_id: user.id,
        attachments: files.map((file) => file.filename).join(","),
      },
    });

    res.json({
      message: "Email has been sent",
      statusCode: 200,
      data: {
        to: email,
        subject,
        message: fullMessage,
        attachments: files.map((file) => file.filename),
      },
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = broadcastEmail;
