const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../../services/emailService");
const { generateOTP, otpExpired } = require("../../utils/generateOTP");

const prisma = new PrismaClient();

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return res.status(400).json({
        error:
          "Oops...Your account is not registered yet. Please register your account",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({
        error: "Oops...Invalid email or password, please check again.",
      });
    }

    const otp = generateOTP();
    const otp_expired = otpExpired();

    const payload = { id: user.id, email: user.email, otp_code: otp };
    const otp_token = jwt.sign(payload, process.env.GENERATE_OTP_SECRET, {
      expiresIn: "7d",
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { otp_code: otp, otp_expired },
    });

    const otp_message = `Your OTP code is <b>${otp}</b>.`;
    const subject = "OTP Verification";

    await sendEmail(user.email, subject, otp_message);

    res.header("Authorization", `Bearer ${otp_token}`).json({
      message:
        "Congratulations! You've successfully logged in. OTP has been sent to your email.",
      statusCode: 200,
      data: {
        id: user.id,
        email: user.email,
        otp_code: otp,
        otp_expired,
        otp_token,
      },
    });
  } catch (error) {
    console.error("Error during login:", error); // Logging the error for debugging
    res.status(500).json({
      error: "An error has occurred",
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = login;
