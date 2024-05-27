const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const getEmailById = async (req, res) => {
  const { id } = req.params;
  const refresh_token = req.cookies.refresh_token;

  try {
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

    const email = await prisma.EmailBroadcast.findUnique({
      where: {
        id: id,
      },
    });

    if (email.user_id !== decoded.id) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You are not authorized to view this email",
      });
    }
    console.log(decoded.email);
    res.json({
      message: "Email has been fetched",
      statusCode: 200,
      data: {
        sender: decoded.email,
        email,
      },
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = getEmailById;
