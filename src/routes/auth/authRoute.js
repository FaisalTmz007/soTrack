const { appRouter } = require('../index');
const { AuthController } = require('../../controllers/auth/index');

appRouter.post('/register', AuthController.controllers.register);
appRouter.post('/login', AuthController.controllers.login);
appRouter.post('/verifyOtp', AuthController.controllers.verifyOtp);
appRouter.post('/refreshOtp', AuthController.controllers.refreshOtp);
appRouter.post('/refreshToken', AuthController.controllers.refreshToken);
appRouter.put('/forgotPassword', AuthController.controllers.forgotPassword);
appRouter.put('/resetPassword', AuthController.controllers.resetPassword);
appRouter.delete('/logout', AuthController.controllers.logout);

module.exports = appRouter;