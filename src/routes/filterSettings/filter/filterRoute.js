const { appRouter } = require("../../index");
const authenticate = require("../../../middlewares/auth/authenticate");
const {
  FilterController,
} = require("../../../controllers/filterSettings/filter/index");

appRouter.post(
  "/filter",
  [authenticate],
  FilterController.controllers.addFilter
);

appRouter.get(
  "/filter",
  [authenticate],
  FilterController.controllers.getAllFilter
);

appRouter.get(
  "/filter-user",
  [authenticate],
  FilterController.controllers.getUserFilter
);

appRouter.put(
  "/filter/:id",
  [authenticate],
  FilterController.controllers.editFilter
);

appRouter.delete(
  "/filter/:id",
  [authenticate],
  FilterController.controllers.deleteFilter
);

module.exports = appRouter;
