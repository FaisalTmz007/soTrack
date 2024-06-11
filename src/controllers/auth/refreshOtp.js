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
    const otp_message = `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
    <div style="margin:50px auto;width:70%;padding:20px 0">
      <div style="border-bottom:1px solid #eee">
        <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Socialens</a>
      </div>
      <p style="font-size:1.1em">Hi,</p>
      <p>Thank you for choosing Socialens. Use the following OTP to complete your authentication. OTP is valid for <b>5 minutes</b></p>
      <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
      <p style="font-size:0.9em;">Regards,<br />Socialens</p>
      <hr style="border:none;border-top:1px solid #eee" />
      <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
        <p>Socialens</p>
        <p>Surabaya, Jawa Timur</p>
      </div>
    </div>
  </div>`;
    const subject = "OTP Verification";

    // Send OTP to user's email
    await sendEmail(user.email, subject, otp_message);

    res.json({
      message: "OTP has been refreshed",
      statusCode: 200,
      data: {
        id: user.id,
        email: user.email,
        // otp_code: otp,
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
