const { PrismaClient } = require("@prisma/client");
const sendOTPEmail = require("../../utils/sendOTPEmail");
const { generateOTP, otpExpired } = require("../../utils/generateOTP");
const prisma = new PrismaClient();

const refreshOtp = async (req, res) => {
  const otp_code = req.body.otp_code;

  if (!otp_code) {
    return res.status(400).json({ error: "OTP is required" });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        otp_code: otp_code,
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

    await sendOTPEmail(user.email, newOtp);

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
