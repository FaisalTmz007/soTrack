const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const sendEmail = require("../../services/emailService");
require("dotenv").config();

const prisma = new PrismaClient();

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const payload = { id: user.id, email: user.email };
    const resetPasswordToken = jwt.sign(
      payload,
      process.env.RESET_PASSWORD_SECRET,
      { expiresIn: "15m" }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { reset_password: resetPasswordToken },
    });

    const resetPasswordLink = `${process.env.FRONTEND_URL}/resetPassword?reset=${resetPasswordToken}`;
    const subject = "Reset Password";

    await sendEmail(user.email, subject, resetPasswordLink);

    res.json({
      message: "Password reset link has been sent to your email",
      statusCode: 200,
      data: {
        id: user.id,
        email: user.email,
        resetPasswordLink,
      },
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error); // Log the error for debugging
    res.status(500).json({
      error: "An error has occurred",
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = forgotPassword;
