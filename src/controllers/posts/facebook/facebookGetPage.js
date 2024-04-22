const axios = require("axios");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const facebookGetPage = async (req, res) => {
  try {
    const token = req.cookies.facebook_access_token;
    console.log("🚀 ~ facebookGetPage ~ token:", token);
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

    const userPage = await axios.get(
      `https://graph.facebook.com/v19.0/${fb_id}/accounts`,
      {
        params: {
          fields: "id,name,instagram_business_account",
          access_token: token,
        },
      }
    );

    return res.json({
      message: "User page has been fetched",
      statusCode: 200,
      data: userPage.data,
    });
  } catch (error) {
    res.status(400).json({
      error: "An error has occured",
      message: error.message,
    });
  }
};

module.exports = facebookGetPage;
