const { PrismaClient } = require("@prisma/client");
const hashPassword = require("../../utils/hashPassword");

require("dotenv").config();
const prisma = new PrismaClient();

// reset password with get token from params
const resetPassword = async (req, res) => {
  try {
    const reset = req.query.reset;

    if (!reset) {
      return res.status(400).json({ error: "Reset link not valid" });
    }

    const user = await prisma.user.findFirst({
      where: {
        reset_password: reset,
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const hashedPassword = hashPassword(password);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        reset_password: null,
      },
    });

    res.json({
      message:
        "Congratulations you're new password has been successfully created.",
      statusCode: 200,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = resetPassword;
