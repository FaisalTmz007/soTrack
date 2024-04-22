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

appRouter.get("/mostDiscussed", DashboardController.controllers.mostDiscussed);

module.exports = appRouter;
