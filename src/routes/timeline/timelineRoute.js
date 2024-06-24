const { appRouter } = require("../index");
const { TimelineController } = require("../../controllers/timeline/index");
const authenticate = require("../../middlewares/auth/authenticate");

appRouter.get(
  "/timeline",
  [authenticate],
  TimelineController.controllers.getTimeline
);

module.exports = appRouter;
