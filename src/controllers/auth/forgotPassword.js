const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const sendEmail = require("../../services/emailService");

require("dotenv").config();
const prisma = new PrismaClient();

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const payload = {
      id: user.id,
      email: user.email,
    };

    const reset_password = jwt.sign(
      payload,
      process.env.RESET_PASSWORD_SECRET,
      {
        expiresIn: "15m",
      }
    );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        reset_password,
      },
    });

    const reset_pass_link = `${process.env.CLIENT_URL}/resetPassword?reset=${reset_password}`;

    const subject = "Reset Password";

    // send reset password link to email
    await sendEmail(user.email, subject, reset_pass_link);

    // sendResetEmail(user.email, reset_pass_link);

    res.json({
      message: "Password reset link has been sent to your email",
      statusCode: 200,
      data: {
        id: user.id,
        email: user.email,
        reset_pass_link: reset_pass_link,
      },
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = forgotPassword;
