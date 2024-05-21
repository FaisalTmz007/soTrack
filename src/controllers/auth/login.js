const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../../services/emailService");
const { generateOTP, otpExpired } = require("../../utils/generateOTP");
const prisma = new PrismaClient();

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    if (!user) {
      return res.status(400).json({
        error:
          "Oops...Your account is not registered yet. Please register your account",
      });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({
        error: "Oops...Invalid email or password please check again.",
      });
    }
    // const tokens = await generateToken(user);
    // console.log(tokens)
    const otp = await generateOTP();
    const otp_expired = await otpExpired();
    // console.log(otp)

    const payload = {
      id: user.id,
      email: user.email,
      otp_code: otp,
    };

    const otp_token = jwt.sign(payload, process.env.GENERATE_OTP_SECRET, {
      expiresIn: "7d",
    });

    // update user otp
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        otp_code: otp,
        otp_expired: otp_expired,
      },
    });
    // console.log(otp, otp_expired)

    const otp_message = `Your OTP code is <b>${otp}</b>.`;

    const subject = "OTP Verification";

    // send otp to email
    await sendEmail(user.email, subject, otp_message);
    // await sendOTPEmail(user.email, otp);

    // console.log(otp_token);
    res.header("Authorization", `Bearer ${otp_token}`);

    res.json({
      message: "OTP has been sent to your email",
      statusCode: 200,
      data: {
        id: user.id,
        email: user.email,
        otp_code: otp,
        otp_expired: otp_expired,
        otp_token: otp_token,
      },
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = login;
