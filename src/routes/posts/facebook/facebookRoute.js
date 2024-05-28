const { appRouter } = require("../../index");
const isLoggedIn = require("../../../middlewares/auth/facebookAuth");
const {
  FacebookController,
} = require("../../../controllers/posts/facebook/index");

appRouter.get("/facebook/page", FacebookController.controllers.facebookGetPage);

module.exports = appRouter;
