const { PrismaClient } = require('@prisma/client');
const generateToken = require('../../utils/generateToken');
const { token } = require('morgan');
const prisma = new PrismaClient();
require('dotenv').config();

const verifyOtp = async (req, res) => {
    const otp_code = req.body.otp_code;
    // console.log(otp_code)
    if(!otp_code) {
        return res.status(400).json({ error: 'OTP is required' });
    }

    try {
        const user = await prisma.user.findFirst({
            where: {
                otp_code: otp_code,
            },
        });
        // console.log(user)

        if(!user) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        const currentDate = new Date(Date.now());
        const otpExpired = new Date(user.otp_expired);
        if(currentDate > otpExpired) {
            return res.status(400).json({ error: 'OTP has expired' });
        }

        // console.log(generateToken(user));
        const token = await generateToken(user);
        // console.log(token.accessToken, token.refreshToken)

        // update user otp
        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                otp_code: null,
                otp_expired: null,
            },
        });

        res
            .cookie('refresh_token', token.refreshToken, { httpOnly: true })
            .header('Authorization', `Bearer ${token.accessToken}`)
        res.json({
            message: 'OTP has been verified',
            statusCode: 200,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                accessToken: token.accessToken,
            },
        });
    } catch (error) {
        res.status(400).json({ 
            error: 'An error has occured',
            message: error.message,
         });
    }
};

module.exports = verifyOtp;