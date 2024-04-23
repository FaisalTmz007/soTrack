const { appRouter } = require("../index");
const {
  FacebookAuthController,
} = require("../../controllers/auth/facebook/index");

appRouter.get(
  "/auth/facebook",
  FacebookAuthController.controllers.facebookAuth
);

appRouter.get(
  "/auth/facebook/callback",
  FacebookAuthController.controllers.facebookCallback
);

appRouter.get(
  "/auth/failed",
  FacebookAuthController.controllers.facebookAuthFailed
);

// appRouter.get(
//   "/facebook/logout",
//   FacebookAuthController.controllers.facebookLogout
// );

module.exports = appRouter;
