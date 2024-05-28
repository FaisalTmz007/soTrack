const { PrismaClient } = require("@prisma/client");
const hashPassword = require("../../utils/hashPassword");
const prisma = new PrismaClient();

const register = async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = hashPassword(password);
  try {
    const userExist = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (userExist) {
      return res.status(400).json({
        error: "Oops...Your account is already registered. Please login again.",
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    res.json({
      message: "Congratulations you're account has been successfully created.",
      statusCode: 200,
      data: {
        id: user.id,
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
module.exports = register;
