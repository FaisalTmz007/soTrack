const { appRouter } = require("../index");
const authenticate = require("../../middlewares/auth/authenticate");
const { BroadcastController } = require("../../controllers/broadcast/index");
const upload = require("../../middlewares/multer/multer");

appRouter.post(
  "/broadcastEmail",
  [authenticate, upload],
  BroadcastController.controllers.broadcastEmail
);

module.exports = appRouter;
