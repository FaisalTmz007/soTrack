const { PrismaClient } = require("@prisma/client");
const generateToken = require("../../utils/generateToken");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();
require("dotenv").config();

const verifyOtp = async (req, res) => {
  const otpHeader = req.headers["authorization"];
  const { otp_code } = req.body;

  try {
    // Ensure OTP token is present
    const otpToken = otpHeader && otpHeader.split(" ")[1];
    if (!otpToken) {
      return res.status(401).json({ error: "Authorization token is missing" });
    }

    // Verify OTP token
    const tokenDecoded = jwt.verify(otpToken, process.env.GENERATE_OTP_SECRET);
    const user = await prisma.user.findFirst({
      where: { id: tokenDecoded.id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if OTP code matches
    if (user.otp_code !== otp_code) {
      return res.status(400).json({
        error:
          "Oops...Sorry the code you entered is incorrect. Please try again!",
      });
    }

    // Check if OTP is expired
    const currentDate = new Date();
    const otpExpired = new Date(user.otp_expired);
    if (currentDate > otpExpired) {
      return res.status(400).json({
        error: "Oops...Sorry the code you entered is expired.",
      });
    }

    // Generate access and refresh tokens
    const token = await generateToken(user);

    // Clear OTP code and expiration in the database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp_code: null,
        otp_expired: null,
      },
    });

    // Set response headers and cookies
    res
      .header("Authorization", `Bearer ${token.accessToken}`)
      .cookie("refresh_token", token.refreshToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      })
      .json({
        message: "Congratulations! You've successfully logged in.",
        statusCode: 200,
        data: {
          id: user.id,
          email: user.email,
          accessToken: token.accessToken,
        },
      });
  } catch (error) {
    console.error("Error verifying OTP:", error); // Log the error for debugging
    res.status(500).json({
      error: "An error has occurred",
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = verifyOtp;
