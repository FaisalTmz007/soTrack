const { appRouter } = require("../index");
const passport = require("passport");
const isLoggedIn = require("../../middlewares/auth/facebookAuth");
const {
  FacebookAuthController,
} = require("../../controllers/auth/facebook/index");

// Route untuk autentikasi Facebook
appRouter.get("/auth/facebook", passport.authenticate("facebook"));

// Route callback untuk autentikasi Facebook
appRouter.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/auth/failed",
  }),
  FacebookAuthController.controllers.facebookCallback
);

// Route untuk menangani kegagalan autentikasi
appRouter.get(
  "/auth/failed",
  FacebookAuthController.controllers.facebookAuthFailed
);

module.exports = appRouter;
