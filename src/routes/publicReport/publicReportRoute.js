const { appRouter } = require("../index");
const {
  PublicReportController,
} = require("../../controllers/publicReport/index");
const upload = require("../../middlewares/multer/multer");

appRouter.get(
  "/report/getProvince",
  PublicReportController.controllers.getProvince
);

appRouter.get("/report/getCity", PublicReportController.controllers.getCity);

appRouter.get(
  "/report/getLinkForm",
  PublicReportController.controllers.getLinkForm
);

appRouter.post(
  "/report/addReport/:user_id",
  upload,
  PublicReportController.controllers.addReport
);

appRouter.put(
  "/report/isHandled/:public_report_id",
  PublicReportController.controllers.isHandled
);

appRouter.delete(
  "/report/deleteReport/:public_report_id",
  PublicReportController.controllers.deleteReport
);

module.exports = appRouter;
