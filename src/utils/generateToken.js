const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const facebook = require("../controllers/auth/facebook");
const prisma = new PrismaClient();

require("dotenv").config();

const generateToken = async (user) => {
  try {
    const payload = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    if (payload.facebook_id) {
      const accessToken = jwt.sign(
        {
          id: payload.id,
          username: payload.username,
          email: payload.email,
          facebook_id: payload.facebook_id,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1d",
        }
      );
      const refreshToken = jwt.sign(
        {
          id: payload.id,
          username: payload.username,
          email: payload.email,
          facebook_id: payload.facebook_id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "7d",
        }
      );

      const userToken = await prisma.UserToken.findFirst({
        where: {
          user_id: user.id,
        },
      });

      if (userToken) {
        await prisma.UserToken.update({
          where: {
            id: userToken.id,
          },
          data: {
            token: refreshToken,
          },
        });
      } else {
        await prisma.UserToken.create({
          data: {
            user_id: user.id,
            token: refreshToken,
          },
        });
      }

      return { accessToken, refreshToken };
    } else {
      const accessToken = jwt.sign(
        {
          id: payload.id,
          username: payload.username,
          email: payload.email,
          facebook_id: null,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1d",
        }
      );
      const refreshToken = jwt.sign(
        {
          id: payload.id,
          username: payload.username,
          email: payload.email,
          facebook_id: null,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "7d",
        }
      );

      const userToken = await prisma.UserToken.findFirst({
        where: {
          user_id: user.id,
        },
      });

      if (userToken) {
        await prisma.UserToken.update({
          where: {
            id: userToken.id,
          },
          data: {
            token: refreshToken,
          },
        });
      } else {
        await prisma.UserToken.create({
          data: {
            user_id: user.id,
            token: refreshToken,
          },
        });
      }

      return { accessToken, refreshToken };
    }
  } catch (error) {}
};

module.exports = generateToken;
