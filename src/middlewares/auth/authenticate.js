const jwt = require('jsonwebtoken');

require('dotenv').config();

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        const token = authHeader && authHeader.split(' ')[1];
        if (token == null) return res.sendStatus(401);

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ 
                    error: 'Invalid token',
                    statusCode: 403,
                    message: err.message,
                 });
            }
            req.user = user;
            next();
        });
    } catch (error) {
        res.status(400).json({ 
            error: 'An error has occured',
            message: error.message,
         });
    }
};

module.exports = authenticate;