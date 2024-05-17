const { appRouter } = require("../index");
const authenticate = require("../../middlewares/auth/authenticate");
const isLoggedIn = require("../../middlewares/auth/facebookAuth");
const { DashboardController } = require("../../controllers/dashboard/index");

appRouter.get(
  "/criminalReports",
  [authenticate],
  DashboardController.controllers.criminalReport
);
appRouter.get(
  "/criminalType",
  [authenticate],
  DashboardController.controllers.criminalType
);

appRouter.get(
  "/mentionSource",
  // [isLoggedIn],
  DashboardController.controllers.mentionSource
);

appRouter.get(
  "/mostDiscussed",
  [authenticate],
  DashboardController.controllers.mostDiscussed
);

appRouter.get(
  "/mentionDetails",
  [authenticate],
  DashboardController.controllers.mentionDetails
);

appRouter.get(
  "/socialMediaMention",
  [authenticate],
  DashboardController.controllers.socialMediaMention
);

appRouter.get(
  "/newsMention",
  [authenticate],
  DashboardController.controllers.newsMention
);

appRouter.get(
  "/mentionAnalytic",
  [authenticate],
  DashboardController.controllers.mentionAnalytic
);

module.exports = appRouter;
