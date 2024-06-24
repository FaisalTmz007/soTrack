const axios = require("axios");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const facebookGetUser = async (req, res) => {
  try {
    const token = req.cookies.facebook_access_token;

    if (!token) {
      return res.status(400).json({
        error: "Unauthorized",
        message:
          "Please go to connect account before you can see social media dashboard",
      });
    }

    const refresh_token = req.cookies.refresh_token;

    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

    const user = await prisma.User.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!user.facebook_id) {
      return res.status(400).json({
        error: "Unauthorized",
        message: "Login with Facebook first",
      });
    }

    const fb_id = user.facebook_id;

    const userInfo = await axios.get(
      `https://graph.facebook.com/v19.0/${fb_id}`,
      {
        params: {
          fields: "id,name,email",
          access_token: token,
        },
      }
    );

    return res.json({
      message: "User info has been fetched",
      statusCode: 200,
      data: userInfo.data,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = facebookGetUser;