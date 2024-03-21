const { appRouter } = require("../../index");
const authenticate = require("../../../middlewares/auth/authenticate");
const {
  FilterController,
} = require("../../../controllers/filterSettings/filter/index");

appRouter.post(
  "/filter-user",
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
  "/filter-user/:id",
  [authenticate],
  FilterController.controllers.editFilter
);

appRouter.delete(
  "/filter-user/:id",
  [authenticate],
  FilterController.controllers.deleteFilter
);

module.exports = appRouter;
