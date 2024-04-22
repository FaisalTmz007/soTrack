const { appRouter } = require("../index");
const axios = require("axios");
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

module.exports = appRouter;
