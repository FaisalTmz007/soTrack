const fs = require("fs");
const path = require("path");

class DashboardController {
  constructor() {
    this.controllers = {};
    this.initControllers();
  }

  initControllers() {
    const controllerPath = __dirname;
    fs.readdirSync(controllerPath).forEach((file) => {
      const controllerName = file.split(".")[0];
      if (controllerName == "index") return;
      this.controllers[controllerName] = require(path.join(
        controllerPath,
        file
      ));
    });
  }
}

module.exports = { DashboardController: new DashboardController() };
