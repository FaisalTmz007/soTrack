const register = require("./register.validator");
const login = require("./login.validator");
const forgotPassword = require("./forgotPassword.validator");
const resetPassword = require("./resetPassword.validator");

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};
