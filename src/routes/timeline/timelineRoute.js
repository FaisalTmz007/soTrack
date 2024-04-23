const { appRouter } = require("../index");
const { TimelineController } = require("../../controllers/timeline/index");

appRouter.get("/timeline", TimelineController.controllers.getTimeline);

module.exports = appRouter;
