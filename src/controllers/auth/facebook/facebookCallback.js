const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const facebookCallback = async function (req, res) {
  try {
    // login success
    // update user table

    res
      .cookie("facebook_access_token", req.user.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .json({
        message: "Logged in successfully",
        statusCode: 200,
        data: {
          facebook_user_id: req.user.id,
          access_token: req.user.accessToken,
        },
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = facebookCallback;
