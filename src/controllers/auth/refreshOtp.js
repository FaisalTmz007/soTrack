const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const sendOTPEmail = require("../../utils/sendOTPEmail");
const { generateOTP, otpExpired } = require("../../utils/generateOTP");
const prisma = new PrismaClient();

const refreshOtp = async (req, res) => {
  const otpHeader = req.headers["authorization"];

  try {
    const token = otpHeader && otpHeader.split(" ")[1];
    if (token == null) return res.sendStatus(401);
    console.log("ini token: " + token);

    const token_decoded = jwt.verify(token, process.env.GENERATE_OTP_SECRET);
    const user = await prisma.user.findFirst({
      where: {
        id: token_decoded.id,
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const otp = await generateOTP();
    const otp_expired = await otpExpired();

    const newOtp = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        otp_code: otp,
        otp_expired: otp_expired,
      },
    });

    await sendOTPEmail(user.email, otp);

    res.json({
      message: "OTP has been refreshed",
      statusCode: 200,
      data: {
        id: user.id,
        email: user.email,
        otp_code: otp,
        otp_expired: otp_expired,
      },
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = refreshOtp;
