const { appRouter } = require("../index");
const authenticate = require("../../middlewares/auth/authenticate");
const { DashboardController } = require("../../controllers/dashboard/index");

appRouter.get(
  "/criminalReports",
  [authenticate],
  DashboardController.controllers.criminalReport
);

module.exports = appRouter;
