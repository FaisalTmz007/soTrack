const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

require('dotenv').config();

const logout = async (req, res) => {
    try {
        // refresh token from cookies
        const refreshToken = req.cookies.refresh_token;

        if(!refreshToken) {
            return res.status(401).json({ error: 'Access denied, token missing!' });
        }

        const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        userToken = await prisma.UserToken.findFirst({
            where: {
                user_id: decodedRefreshToken.id,
            },
        });
        console.log("usertoken: " + userToken)

        // delete refresh token from database
        await prisma.UserToken.delete({
            where: {
                id: userToken.id,
            },
        });

        res.clearCookie('refresh_token');
        res.json({ 
            message: 'Logout successful',
            statusCode: 200
         });
    } catch (error) {
        res.status(401).json({ 
            error: 'An error has occured',
            message: error.message,
         });
    }
};

module.exports = logout;