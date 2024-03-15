const { PrismaClient } = require("@prisma/client");
const generateToken = require("../../utils/generateToken");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();
require("dotenv").config();

const verifyOtp = async (req, res) => {
  const otpHeader = req.headers["authorization"];
  const { otp_code } = req.body;

  try {
    const otpToken = otpHeader && otpHeader.split(" ")[1];
    if (otpToken == null) return res.sendStatus(401);
    // console.log("ini token: " + token);

    const token_decoded = jwt.verify(otpToken, process.env.GENERATE_OTP_SECRET);
    const user = await prisma.user.findFirst({
      where: {
        id: token_decoded.id,
      },
    });
    // console.log(user)
    if (user.otp_code !== otp_code) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const currentDate = new Date(Date.now());
    const otpExpired = new Date(user.otp_expired);
    if (currentDate > otpExpired) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    // console.log(generateToken(user));
    const token = await generateToken(user);
    // console.log(token.accessToken, token.refreshToken)

    // update user otp
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        otp_code: null,
        otp_expired: null,
      },
    });

    res
      .header("Authorization", `Bearer ${token.accessToken}`)
      .cookie("refresh_token", token.refreshToken, {
        httpOnly: true,
      })
      .json({
        message: "OTP has been verified",
        statusCode: 200,
        data: {
          id: user.id,
          email: user.email,
          accessToken: token.accessToken,
        },
      });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = verifyOtp;
