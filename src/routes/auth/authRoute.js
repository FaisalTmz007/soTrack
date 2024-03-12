const { appRouter } = require("../index");
const Validator = require("../../middlewares/Validator/validator");
const { AuthController } = require("../../controllers/auth/index");

appRouter.post(
  "/register",
  Validator("register"),
  AuthController.controllers.register
);
appRouter.post("/login", Validator("login"), AuthController.controllers.login);
appRouter.put("/verifyOtp", AuthController.controllers.verifyOtp);
appRouter.put("/refreshOtp", AuthController.controllers.refreshOtp);
appRouter.get("/refreshToken", AuthController.controllers.refreshToken);
appRouter.put(
  "/forgotPassword",
  Validator("forgotPassword"),
  AuthController.controllers.forgotPassword
);
appRouter.put(
  "/resetPassword",
  Validator("resetPassword"),
  AuthController.controllers.resetPassword
);
appRouter.delete("/logout", AuthController.controllers.logout);

module.exports = appRouter;
