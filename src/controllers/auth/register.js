const { PrismaClient } = require('@prisma/client');
const hashPassword = require('../../utils/hashPassword');
const prisma = new PrismaClient();


const register = async (req, res) => {
    const { username, email, password  } = req.body;
    const hashedPassword = hashPassword(password);
    try {
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });
        res.json({
            message: 'User has been created',
            statusCode: 200,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        
        });
    } catch (error) {
        res.status(400).json({
            error: 'An error has occured',
            message: error.message,
        });
    }
}
module.exports = register;