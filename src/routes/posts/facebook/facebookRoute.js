const { appRouter } = require("../../index");
const isLoggedIn = require("../../../middlewares/auth/facebookAuth");
const {
  FacebookController,
} = require("../../../controllers/posts/facebook/index");

appRouter.get("/facebook/page", FacebookController.controllers.facebookGetPage);

appRouter.get("/facebook/user", FacebookController.controllers.facebookGetUser);

module.exports = appRouter;
