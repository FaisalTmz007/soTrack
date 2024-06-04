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
    const message = `
    <div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 2;">
      <div style="margin: 50px auto; width: 70%; padding: 20px 0;">
        <div style="border-bottom: 1px solid #eee;">
          <a href="" style="font-size: 1.4em; color: #00466a; text-decoration: none; font-weight: 600;">Socialens</a>
        </div>
        <p style="font-size: 1.1em;">Hi,</p>
        <p>Forgot your password?</p>
        <p>We received a request to reset the password for your account.</p>
        <p>To reset your password, click on the button below:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetPasswordLink}" style="background-color: #00466a; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
        </div>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${resetPasswordLink}</p>
        <br />
        <p style="font-size: 0.9em;">Regards,<br />Socialens</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <div style="float: right; padding: 8px 0; color: #aaa; font-size: 0.8em; line-height: 1; font-weight: 300;">
          <p>Socialens</p>
          <p>Surabaya, Jawa Timur</p>
        </div>
      </div>
    </div>
  `;
    const subject = "Reset Password";

    await sendEmail(user.email, subject, message);

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
