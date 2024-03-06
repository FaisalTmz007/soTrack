const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

require('dotenv').config();

const generateToken = async (user) => {
    try {
        const payload = await prisma.user.findUnique({
            where: {
                id: user.id,
            },
        })
        const accessToken = jwt.sign({ id: payload.id, username: payload.username, email: payload.email }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '15m',
        });
        const refreshToken = jwt.sign({ id: payload.id, username: payload.username, email: payload.email }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: '7d',
        });

        // console.log("access_token: " + accessToken, "refresh_token: " + refreshToken)
        const userToken = await prisma.UserToken.findFirst({
            where: {
                user_id: user.id,
            },
        });

        if(userToken) {
            await prisma.UserToken.update({
                where: {
                    id: userToken.id,
                },
                data: {
                    token: refreshToken,
                },
            });
        }

        return { accessToken, refreshToken };
    } catch (error) {
        
    }
};

module.exports = generateToken;