const { PrismaClient } = require("@prisma/client");
const hashPassword = require("../../utils/hashPassword");
const prisma = new PrismaClient();

const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user already exists
    const userExist = await prisma.user.findFirst({
      where: { email },
    });

    if (userExist) {
      return res.status(400).json({
        error: "Oops...Your account is already registered. Please login again.",
      });
    }

    // Asynchronously hash the password
    const hashedPassword = await hashPassword(password);

    // Create a new user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      message: "Congratulations! Your account has been successfully created.",
      statusCode: 201,
      data: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error); // Log the error for debugging
    res.status(500).json({
      error: "An error has occurred",
      message: error.message,
    });
  } finally {
    // Ensure the Prisma client is properly closed
    await prisma.$disconnect();
  }
};

module.exports = register;
