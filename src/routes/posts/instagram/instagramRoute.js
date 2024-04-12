const { appRouter } = require("../../index");
const {
  InstagramController,
} = require("../../../controllers/posts/instagram/index");
const isLoggedIn = require("../../../middlewares/auth/facebookAuth");

appRouter.get(
  "/instagram/getTagPost",
  isLoggedIn,
  InstagramController.controllers.getTagPost
);

module.exports = appRouter;
