const { appRouter } = require("../index");
const authenticate = require("../../middlewares/auth/authenticate");
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

module.exports = appRouter;
