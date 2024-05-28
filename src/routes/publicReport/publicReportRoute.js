const { appRouter } = require("../index");
const {
  PublicReportController,
} = require("../../controllers/publicReport/index");
const authenticate = require("../../middlewares/auth/authenticate");
const upload = require("../../middlewares/multer/multer");

appRouter.get(
  "/report/getProvince",
  PublicReportController.controllers.getProvince
);

appRouter.get("/report/getCity", PublicReportController.controllers.getCity);

appRouter.get(
  "/report/getAllCategory",
  PublicReportController.controllers.getAllCategory
);

appRouter.get(
  "/report/getLinkForm",
  PublicReportController.controllers.getLinkForm
);

appRouter.get(
  "/report/getAllReport",
  [authenticate],
  PublicReportController.controllers.getAllReport
);

appRouter.get(
  "/report/getReport/:id",
  [authenticate],
  PublicReportController.controllers.getReportById
);

appRouter.post(
  "/report/addReport/:user_id",
  [upload],
  PublicReportController.controllers.addReport
);

appRouter.put(
  "/report/isHandled/:public_report_id",
  [authenticate],
  PublicReportController.controllers.isHandled
);

appRouter.delete(
  "/report/deleteReport/:public_report_id",
  [authenticate],
  PublicReportController.controllers.deleteReport
);

module.exports = appRouter;
