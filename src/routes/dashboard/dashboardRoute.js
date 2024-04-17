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
  [isLoggedIn],
  DashboardController.controllers.mentionSource
);

appRouter.get(
  "/mostDiscussed",
  (req, res, next) => {
    if (req.query.platform === "news") {
      DashboardController.controllers.mostDiscussed(req, res, next);
    } else {
      isLoggedIn(req, res, next);
    }
  },
  DashboardController.controllers.mostDiscussed
);

module.exports = appRouter;
