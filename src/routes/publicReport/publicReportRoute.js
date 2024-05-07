const { appRouter } = require("../index");
const {
  PublicReportController,
} = require("../../controllers/publicReport/index");

appRouter.get("/getProvince", PublicReportController.controllers.getProvince);

appRouter.get("/getCity", PublicReportController.controllers.getCity);

module.exports = appRouter;
