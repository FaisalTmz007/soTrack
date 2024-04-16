const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const generateToken = require("../../../utils/generateToken");
const prisma = new PrismaClient();

const facebookCallback = async function (req, res) {
  try {
    const refresh_token = req.cookies.refresh_token;

    if (!refresh_token) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

    const userUpdate = await prisma.User.update({
      where: {
        id: decoded.id,
      },
      data: {
        facebook_id: req.user.id,
      },
    });

    const token = await generateToken(userUpdate);

    res
      .header("Authorization", `Bearer ${token.accessToken}`)
      .cookie("refresh_token", token.refreshToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      })
      .cookie("facebook_access_token", req.user.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      // .json({
      //   message: "Logged in successfully",
      //   statusCode: 200,
      //   data: {
      //     facebook_user_id: req.user.id,
      //     access_token: req.user.accessToken,
      //   },
      // });
      .redirect(
        `${process.env.FRONTEND_URL}/auth/facebook/callback?facebook_user_id=${req.user.id}`
      );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = facebookCallback;
