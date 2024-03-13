const { appRouter } = require("../../index");
const authenticate = require("../../../middlewares/auth/authenticate");
const {
  CategoryController,
} = require("../../../controllers/filterSettings/category/index");

appRouter.post(
  "/category",
  [authenticate],
  CategoryController.controllers.addCategory
);
appRouter.get(
  "/category",
  [authenticate],
  CategoryController.controllers.getAllCategory
);
appRouter.put(
  "/category/:id",
  [authenticate],
  CategoryController.controllers.editCategory
);
appRouter.delete(
  "/category/:id",
  [authenticate],
  CategoryController.controllers.deleteCategory
);

module.exports = appRouter;
