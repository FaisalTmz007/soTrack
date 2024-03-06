const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const sendOTPEmail = require('../../utils/sendOTPEmail');
const { generateOTP, otpExpired } = require('../../utils/generateOTP');
const prisma = new PrismaClient();

const login = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    {
                        username,
                    },
                    {
                        email,
                    },
                ],
            },
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        // const tokens = await generateToken(user);
        // console.log(tokens)
        const otp = await generateOTP();
        const otp_expired = await otpExpired();
        // console.log(otp)

        // update user otp
        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                otp_code: otp,
                otp_expired: otp_expired,
            },
        });
        // console.log(otp, otp_expired)

        // send otp to email
        await sendOTPEmail(user.email, otp);

        res.json({ 
            message: 'OTP has been sent to your email',
            statusCode: 200,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                otp_code: otp,
                otp_expired: otp_expired
            }
         });
    } catch (error) {
        res.status(400).json({
            error: 'An error has occured',
            message: error.message,
        });
    }
};

module.exports = login;