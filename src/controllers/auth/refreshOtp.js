const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const sendEmail = require("../../services/emailService");
const { generateOTP, otpExpired } = require("../../utils/generateOTP");
const prisma = new PrismaClient();
require("dotenv").config();

const refreshOtp = async (req, res) => {
  const otpHeader = req.headers["authorization"];

  try {
    // Ensure OTP token is present
    const token = otpHeader && otpHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Authorization token is missing" });
    }

    // Verify OTP token
    const tokenDecoded = jwt.verify(token, process.env.GENERATE_OTP_SECRET);
    const user = await prisma.user.findFirst({
      where: { id: tokenDecoded.id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate new OTP and expiry
    const otp = generateOTP();
    const otp_expired = otpExpired();

    // Update user OTP in database
    await prisma.user.update({
      where: { id: user.id },
      data: { otp_code: otp, otp_expired },
    });

    // Prepare OTP message and subject
    const otpMessage = `Your OTP code is <b>${otp}</b>.`;
    const subject = "OTP Verification";

    // Send OTP to user's email
    await sendEmail(user.email, subject, otpMessage);

    res.json({
      message: "OTP has been refreshed",
      statusCode: 200,
      data: {
        id: user.id,
        email: user.email,
        otp_code: otp,
        otp_expired,
      },
    });
  } catch (error) {
    console.error("Error refreshing OTP:", error); // Log the error for debugging
    res.status(500).json({
      error: "An error has occurred",
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = refreshOtp;
