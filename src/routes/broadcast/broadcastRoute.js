const { appRouter } = require("../index");
const authenticate = require("../../middlewares/auth/authenticate");
const { BroadcastController } = require("../../controllers/broadcast/index");
const upload = require("../../middlewares/multer/multer");

appRouter.post(
  "/sendEmail",
  [authenticate, upload],
  BroadcastController.controllers.broadcastEmail
);

appRouter.get(
  "/getEmails",
  authenticate,
  BroadcastController.controllers.getAllEmail
);

appRouter.get(
  "/getEmail/:id",
  authenticate,
  BroadcastController.controllers.getEmailById
);

appRouter.delete(
  "/deleteEmail/:id",
  authenticate,
  BroadcastController.controllers.deleteEmailById
);

module.exports = appRouter;
