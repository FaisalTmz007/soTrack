const { appRouter } = require("../../index");
const isLoggedIn = require("../../../middlewares/auth/facebookAuth");
const {
  FacebookController,
} = require("../../../controllers/posts/facebook/index");

// Route untuk profil pengguna
appRouter.get(
  "/facebook/profile",
  isLoggedIn,
  FacebookController.controllers.facebookProfile
);

appRouter.get(
  "/facebook/user",
  isLoggedIn,
  FacebookController.controllers.facebookGetUser
);

appRouter.get(
  "/facebook/page",
  isLoggedIn,
  FacebookController.controllers.facebookGetPage
);

module.exports = appRouter;
