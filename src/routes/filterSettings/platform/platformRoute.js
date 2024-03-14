const { appRouter } = require("../../index");
const authenticate = require("../../../middlewares/auth/authenticate");
const {
  PlatformController,
} = require("../../../controllers/filterSettings/platform/index");

appRouter.get(
  "/platform",
  [authenticate],
  PlatformController.controllers.getAllPlatform
);

appRouter.post(
  "/platform",
  [authenticate],
  PlatformController.controllers.addPlatform
);

appRouter.put(
  "/platform/:id",
  [authenticate],
  PlatformController.controllers.editPlatform
);

appRouter.delete(
  "/platform/:id",
  [authenticate],
  PlatformController.controllers.deletePlatform
);

module.exports = appRouter;
